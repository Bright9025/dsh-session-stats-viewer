/**
 * Host half of the session-stats bundle.
 *
 * Folds Session logs into compact per-hour usage buckets (tokens, turn wall
 * time, first-token latency, decode throughput, tool outcomes) and serves the
 * result to the Web page through one authenticated `/api` route. Process
 * runtime facts (CPU, memory, event-loop delay, uptime) are sampled in this
 * Host process every five seconds.
 *
 * Fold reuse: per-Session folds are cached by persistence revision, so a
 * refresh re-reads only Sessions whose logs changed. The last fold is also
 * written under `$DSH_HOME/cache/session-stats/` so the first request after a
 * restart renders immediately from the previous snapshot while a background
 * refresh catches up.
 *
 * The feature is strictly read-only: it reads Session logs through
 * `ctx.sessionQuery` and never appends, mutates, archives, or deletes them.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { monitorEventLoopDelay } from 'node:perf_hooks';

const ROUTE = '/api/session-stats.data';
const REQUEST_MARKER = 'session-stats-read';
const HOUR_MS = 3600000;
const DAY_MS = 86400000;
const CACHE_TTL_MS = 60000;
const SAMPLE_MS = 5000;
const MAX_SESSIONS = 24;
const SNAPSHOT_VERSION = 2;
const SNAPSHOT_DIR = 'session-stats';
const SNAPSHOT_FILE = 'fold-v2.json';
const PRICE_DEFAULTS = {
  /** CNY per million uncached input tokens. */
  input: 0.5,
  /** CNY per million cache-read input tokens. */
  cacheRead: 0.05,
  /** CNY per million cache-write input tokens. */
  cacheWrite: 0.5,
  /** CNY per million output tokens. */
  output: 2,
  /** CNY per US dollar, used by the page's currency switch. */
  cnyPerUsd: 7.2,
};

export const RANGES = {
  '24h': { bucket: 'hour', points: 24 },
  '7d': { bucket: 'day', points: 7 },
  '14d': { bucket: 'day', points: 14 },
  '30d': { bucket: 'day', points: 30 },
  all: { bucket: 'day', points: null },
};

export const inject = ['connection', 'sessionPersistence', 'sessionQuery', 'timer'];

/**
 * Mount the read-only statistics route and its runtime sampler.
 * @param {object} ctx - Host context carrying Connection, Session persistence, and Session Query.
 * @param {object} [config] - Row configuration: `pricing` overrides.
 */
export function apply(ctx, config) {
  const pricing = resolvePricing(config);
  const runtime = createRuntimeSampler();
  const store = createStatsStore(ctx);
  store.load();

  ctx.effect(() => runtime.start(ctx), 'session-stats: runtime sampler');
  ctx.effect(() => ctx.timeout(() => {
    store.refresh().catch(() => undefined);
  }, 1500), 'session-stats: warm fold');
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: (request) => handleRequest(ctx, store, runtime, pricing, request),
      }),
    'session-stats: read route',
  );
}

/**
 * Resolve price overrides from the row configuration.
 * @param {object} [config] - Row configuration.
 * @returns {{input:number,cacheRead:number,cacheWrite:number,output:number,cnyPerUsd:number}}
 */
export function resolvePricing(config) {
  const source = config && typeof config === 'object' && config.pricing && typeof config.pricing === 'object' ? config.pricing : {};
  const pricing = { ...PRICE_DEFAULTS };
  for (const key of Object.keys(PRICE_DEFAULTS)) {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value >= 0) pricing[key] = value;
  }
  return pricing;
}

/**
 * Per-Session fold cache keyed by persistence revision, plus a durable snapshot
 * of the last complete fold so the page can render before a refresh finishes.
 * @param {object} ctx - Host context.
 * @returns {{load: () => void, refresh: () => Promise<object>, read: (options?: {force?: boolean}) => Promise<{fold: object, stale: boolean}>}}
 */
function createStatsStore(ctx) {
  const state = {
    sessions: new Map(),
    revisions: new Map(),
    lastFoldAt: 0,
    fresh: false,
    total: 0,
    failed: 0,
    pending: null,
  };

  const load = () => {
    const saved = readSnapshot();
    if (saved === null) return;
    for (const entry of saved.sessions) {
      if (entry === null || typeof entry !== 'object' || typeof entry.id !== 'string') continue;
      const fold = entry.fold;
      if (fold === null || typeof fold !== 'object' || !Array.isArray(fold.buckets)) continue;
      const buckets = new Map();
      for (const pair of fold.buckets) {
        if (Array.isArray(pair) && typeof pair[0] === 'number' && pair[1] !== null && typeof pair[1] === 'object') {
          buckets.set(pair[0], normalizeBucket(pair[1]));
        }
      }
      state.sessions.set(entry.id, {
        revision: typeof entry.revision === 'string' ? entry.revision : null,
        fold: { ...fold, buckets },
      });
    }
    state.lastFoldAt = typeof saved.savedAt === 'number' ? saved.savedAt : 0;
    state.total = state.sessions.size;
    state.fresh = false;
  };

  const refresh = () => {
    if (state.pending !== null) return state.pending;
    state.pending = refreshFold(ctx, state)
      .then((result) => {
        state.lastFoldAt = Date.now();
        state.fresh = true;
        writeSnapshot(state);
        return result;
      })
      .finally(() => {
        state.pending = null;
      });
    return state.pending;
  };

  const read = async (options) => {
    const force = options !== undefined && options.force === true;
    if (force) {
      await refresh();
      return { fold: currentFold(state), stale: false };
    }
    const expired = Date.now() - state.lastFoldAt > CACHE_TTL_MS;
    if (state.fresh && !expired) {
      return { fold: currentFold(state), stale: false };
    }
    if (state.sessions.size > 0) {
      refresh().catch(() => undefined);
      return { fold: currentFold(state), stale: true };
    }
    await refresh();
    return { fold: currentFold(state), stale: false };
  };

  return { load, refresh, read };
}

/**
 * Re-read only Sessions whose persistence revision changed.
 * @param {object} ctx - Host context.
 * @param {object} state - Mutable store state.
 * @returns {Promise<object>} Fold snapshot.
 */
async function refreshFold(ctx, state) {
  const records = await ctx.sessionPersistence.list();
  const next = new Map();
  const nextRevisions = new Map();
  let failed = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < records.length) {
      const record = records[cursor];
      cursor += 1;
      const id = record.header.id;
      const cached = state.sessions.get(id);
      if (cached !== undefined && cached.revision !== null && cached.revision === record.revision) {
        next.set(id, cached);
        nextRevisions.set(id, record.revision);
        continue;
      }
      try {
        const reading = await readSessionWithTitle(ctx, id);
        next.set(id, {
          revision: record.revision,
          fold: foldSession(record.header, reading.events, reading.title),
        });
        nextRevisions.set(id, record.revision);
      } catch {
        failed += 1;
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  state.sessions = next;
  state.revisions = nextRevisions;
  state.total = records.length;
  state.failed = failed;
  return currentFold(state);
}

/**
 * @param {object} state - Store state.
 * @returns {{sessions: object[], total: number, failed: number, readAt: number}}
 */
function currentFold(state) {
  return {
    sessions: [...state.sessions.values()].map((entry) => entry.fold),
    total: state.total,
    failed: state.failed,
    readAt: state.lastFoldAt,
  };
}

/** Snapshot file path under `$DSH_HOME/cache`. */
function snapshotPath() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(home, 'cache', SNAPSHOT_DIR, SNAPSHOT_FILE);
}

/**
 * Read the last persisted fold; a missing or malformed file is ignored.
 * @returns {{savedAt: number, sessions: object[]}|null}
 */
function readSnapshot() {
  try {
    const raw = fs.readFileSync(snapshotPath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || parsed.version !== SNAPSHOT_VERSION || !Array.isArray(parsed.sessions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Write the current fold atomically; failures leave the previous snapshot.
 * @param {object} state - Store state.
 */
function writeSnapshot(state) {
  try {
    const target = snapshotPath();
    const payload = {
      version: SNAPSHOT_VERSION,
      savedAt: Date.now(),
      sessions: [...state.sessions.values()].map((entry) => ({
        id: entry.fold.id,
        revision: entry.revision,
        fold: { ...entry.fold, buckets: [...entry.fold.buckets.entries()] },
      })),
    };
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(payload), 'utf8');
    fs.renameSync(temporary, target);
  } catch {
    /* The cache is an optimization; a failed write changes nothing. */
  }
}

/**
 * Read one Session log together with its client-visible title projection.
 * The title shown by the sidebar lives in the `title` projection (session-title
 * unit) and is not guaranteed to appear as an event in the raw log, so the
 * projection snapshot is the authoritative source.
 * @param {object} ctx - Host context.
 * @param {string} id - Session id.
 * @returns {Promise<{events: object[], title: string|null}>}
 */
async function readSessionWithTitle(ctx, id) {
  let observation = null;
  try {
    observation = await ctx.sessionQuery.observeSession(id, { projectionMode: 'all' });
  } catch {
    observation = null;
  }
  if (observation === null) {
    const log = await ctx.sessionQuery.readSession(id);
    return { events: log.events, title: null };
  }
  try {
    const title = observation.projections?.values?.title;
    return {
      events: observation.events,
      title: typeof title === 'string' && title.length > 0 ? title : null,
    };
  } finally {
    disposeObservation(observation);
  }
}

/** Release an observation lease across the supported disposal spellings. */
function disposeObservation(observation) {
  if (observation === null || typeof observation !== 'object') return;
  const symbol = Symbol.dispose;
  if (typeof observation[symbol] === 'function') {
    try {
      observation[symbol]();
    } catch {
      /* release is best effort */
    }
    return;
  }
  if (typeof observation.dispose === 'function') {
    try {
      observation.dispose();
    } catch {
      /* release is best effort */
    }
  }
}

/**
 * Current workspace display titles keyed by normalized directory.
 * @param {object} ctx - Host context.
 * @returns {Map<string, string>}
 */
function workspaceTitleMap(ctx) {
  const map = new Map();
  try {
    const registry = ctx.get('workspaceRegistry');
    const list = registry && typeof registry.list === 'function' ? registry.list() : [];
    for (const workspace of list) {
      if (workspace === null || typeof workspace !== 'object') continue;
      if (typeof workspace.path !== 'string' || typeof workspace.title !== 'string') continue;
      map.set(normalizePath(workspace.path), workspace.title);
    }
  } catch {
    /* A missing registry only removes the workspace label. */
  }
  return map;
}

/** Normalize a directory for case-insensitive Windows comparisons. */
export function normalizePath(value) {
  try {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  } catch {
    return value;
  }
}

/**
 * One empty hour bucket with every field the fold reads back.
 */
function emptyBucket() {
  return {
    input: 0,
    cacheRead: 0,
    cacheWrite: 0,
    output: 0,
    turns: 0,
    turnMs: 0,
    ttftSum: 0,
    ttftCount: 0,
    decodeMs: 0,
    decodeTokens: 0,
    toolCalls: 0,
    toolErrors: 0,
    models: {},
  };
}

/**
 * Rehydrate a persisted bucket, tolerating missing fields from older snapshots.
 * @param {object} source - Persisted bucket.
 * @returns {object} Bucket with numeric fields.
 */
function normalizeBucket(source) {
  const bucket = emptyBucket();
  for (const key of ['input', 'cacheRead', 'cacheWrite', 'output', 'turns', 'turnMs', 'ttftSum', 'ttftCount', 'decodeMs', 'decodeTokens', 'toolCalls', 'toolErrors']) {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value > 0) bucket[key] = value;
  }
  if (source.models !== null && typeof source.models === 'object') {
    for (const [model, usage] of Object.entries(source.models)) {
      if (usage === null || typeof usage !== 'object') continue;
      bucket.models[model] = {
        input: numberOr0(usage.input),
        cacheRead: numberOr0(usage.cacheRead),
        cacheWrite: numberOr0(usage.cacheWrite),
        output: numberOr0(usage.output),
      };
    }
  }
  return bucket;
}

/**
 * Fold one Session log into hour buckets and session identity.
 * @param {object} header - Immutable Session header.
 * @param {object[]} events - Complete durable log in seq order.
 * @param {string|null} knownTitle - Title override, when a caller already folded one.
 * @returns {object} Session fold consumed by {@link buildView}.
 */
export function foldSession(header, events, knownTitle) {
  const buckets = new Map();
  let title = typeof knownTitle === 'string' && knownTitle.length > 0 ? knownTitle : '';
  let fallbackTitle = '';
  let sawUserText = false;
  let firstTime = Infinity;
  let lastTime = -Infinity;
  let activeMs = 0;
  let turnCount = 0;
  const turnStarts = new Map();
  let stepStart = 0;

  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    const time = typeof event.time === 'number' ? event.time : 0;
    if (time > 0) {
      if (time < firstTime) firstTime = time;
      if (time > lastTime) lastTime = time;
    }
    const data = event.data;
    switch (event.type) {
      case 'session/title':
        if (title.length === 0 && typeof data?.title === 'string') title = data.title;
        break;
      case 'user/message':
        if (!sawUserText) {
          const text = messageText(data);
          if (text.length > 0) {
            fallbackTitle = text;
            sawUserText = true;
          }
        }
        break;
      case 'turn/start':
        if (typeof data?.turn === 'number') turnStarts.set(data.turn, time);
        break;
      case 'turn/end': {
        const start = turnStarts.get(data?.turn);
        if (typeof start === 'number' && time >= start) {
          const duration = time - start;
          const bucket = bucketFor(buckets, time);
          bucket.turns += 1;
          bucket.turnMs += duration;
          activeMs += duration;
          turnCount += 1;
          turnStarts.delete(data.turn);
        }
        break;
      }
      case 'step/start':
        stepStart = time;
        break;
      case 'assistant/message': {
        const usage = data?.usage;
        if (!usage || typeof usage !== 'object') break;
        const bucket = bucketFor(buckets, time);
        const input = numberOr0(usage.inputTokens);
        const cacheRead = numberOr0(usage.cacheReadTokens);
        const cacheWrite = numberOr0(usage.cacheWriteTokens);
        const output = numberOr0(usage.outputTokens);
        bucket.input += input;
        bucket.cacheRead += cacheRead;
        bucket.cacheWrite += cacheWrite;
        bucket.output += output;
        const model = modelOf(data);
        if (model !== null) {
          let modelBucket = bucket.models[model];
          if (modelBucket === undefined) {
            modelBucket = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
            bucket.models[model] = modelBucket;
          }
          modelBucket.input += input;
          modelBucket.cacheRead += cacheRead;
          modelBucket.cacheWrite += cacheWrite;
          modelBucket.output += output;
        }
        const stream = streamStats(data.stream);
        if (stream.firstTokenAt !== null && stepStart > 0 && time >= stepStart) {
          bucket.ttftSum += Math.min(Math.max(stream.firstTokenAt - stepStart, 0), 600000);
          bucket.ttftCount += 1;
        }
        if (stream.decodeMs > 0) {
          bucket.decodeMs += stream.decodeMs;
          bucket.decodeTokens += output;
        }
        break;
      }
      case 'tool/call':
        bucketFor(buckets, time).toolCalls += 1;
        break;
      case 'tool/result':
        if (data?.error) bucketFor(buckets, time).toolErrors += 1;
        break;
      default:
        break;
    }
  }

  const resolvedTitle = title.length > 0 ? title : fallbackTitle.length > 0 ? fallbackTitle.slice(0, 48) : '';
  return {
    id: header.id,
    createdAt: typeof header.createdAt === 'number' ? header.createdAt : firstTime === Infinity ? 0 : firstTime,
    cwd: typeof header.cwd === 'string' ? header.cwd : null,
    title: resolvedTitle,
    activeMs,
    turnCount,
    firstTime: firstTime === Infinity ? 0 : firstTime,
    lastTime: lastTime === -Infinity ? 0 : lastTime,
    buckets,
  };
}

/**
 * Project the full fold onto one range for the page.
 * @param {object} fold - Result of a store refresh.
 * @param {string} rangeId - One key of {@link RANGES}.
 * @param {object} pricing - Resolved prices.
 * @param {Map<string, string>} [workspaceByPath] - Workspace titles keyed by normalized directory.
 * @returns {object} JSON-safe view.
 */
export function buildView(fold, rangeId, pricing, workspaceByPath = new Map()) {
  const definition = RANGES[rangeId] ?? RANGES['7d'];
  const now = Date.now();
  const points = [];
  let indexOfHour = null;
  if (definition.bucket === 'hour') {
    const currentHour = Math.floor(now / HOUR_MS) * HOUR_MS;
    for (let i = definition.points - 1; i >= 0; i -= 1) {
      const ts = currentHour - i * HOUR_MS;
      points.push({ ts, label: hourLabel(ts), input: 0, cacheRead: 0, cacheWrite: 0, output: 0, turnMs: 0, turns: 0, ttftSum: 0, ttftCount: 0, decodeMs: 0, decodeTokens: 0, toolCalls: 0, toolErrors: 0 });
    }
    indexOfHour = (hour) => {
      const index = Math.round((hour - points[0].ts) / HOUR_MS);
      return index >= 0 && index < points.length ? index : -1;
    };
  } else if (definition.bucket === 'day' && definition.points === null) {
    let earliest = Infinity;
    for (const session of fold.sessions) {
      if (session.createdAt > 0 && session.createdAt < earliest) earliest = session.createdAt;
      for (const hour of session.buckets.keys()) {
        if (hour < earliest) earliest = hour;
      }
    }
    const today = startOfLocalDay(now);
    let startDay = startOfLocalDay(earliest === Infinity ? now : Math.min(earliest, now));
    let dayCount = Math.round((today - startDay) / DAY_MS) + 1;
    if (dayCount > 3660) {
      startDay = shiftLocalDays(today, -3659);
      dayCount = 3660;
    }
    for (let i = 0; i < dayCount; i += 1) {
      const ts = shiftLocalDays(startDay, i);
      points.push({ ts, label: dayLabel(ts), input: 0, cacheRead: 0, cacheWrite: 0, output: 0, turnMs: 0, turns: 0, ttftSum: 0, ttftCount: 0, decodeMs: 0, decodeTokens: 0, toolCalls: 0, toolErrors: 0 });
    }
    const byDay = new Map();
    for (let i = 0; i < points.length; i += 1) byDay.set(points[i].ts, i);
    indexOfHour = (hour) => {
      const key = startOfLocalDay(hour);
      const index = byDay.get(key);
      return index === undefined ? -1 : index;
    };
  } else {
    const today = startOfLocalDay(now);
    for (let i = definition.points - 1; i >= 0; i -= 1) {
      const ts = shiftLocalDays(today, -i);
      points.push({ ts, label: dayLabel(ts), input: 0, cacheRead: 0, cacheWrite: 0, output: 0, turnMs: 0, turns: 0, ttftSum: 0, ttftCount: 0, decodeMs: 0, decodeTokens: 0, toolCalls: 0, toolErrors: 0 });
    }
    const byDay = new Map();
    for (let i = 0; i < points.length; i += 1) byDay.set(points[i].ts, i);
    indexOfHour = (hour) => {
      const key = startOfLocalDay(hour);
      const index = byDay.get(key);
      return index === undefined ? -1 : index;
    };
  }

  const startTs = points[0].ts;
  const sessions = [];
  const modelTotals = new Map();
  const totals = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, turns: 0, turnMs: 0, ttftSum: 0, ttftCount: 0, decodeMs: 0, decodeTokens: 0, toolCalls: 0, toolErrors: 0 };

  for (const session of fold.sessions) {
    const tokens = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
    const models = {};
    let activeMs = 0;
    let turns = 0;
    for (const [hour, bucket] of session.buckets) {
      if (hour < startTs) continue;
      const index = indexOfHour(hour);
      if (index < 0) continue;
      const point = points[index];
      for (const key of ['input', 'cacheRead', 'cacheWrite', 'output', 'turnMs', 'turns', 'ttftSum', 'ttftCount', 'decodeMs', 'decodeTokens', 'toolCalls', 'toolErrors']) {
        point[key] += bucket[key];
      }
      tokens.input += bucket.input;
      tokens.cacheRead += bucket.cacheRead;
      tokens.cacheWrite += bucket.cacheWrite;
      tokens.output += bucket.output;
      activeMs += bucket.turnMs;
      turns += bucket.turns;
      for (const [model, usage] of Object.entries(bucket.models)) {
        let entry = models[model];
        if (entry === undefined) {
          entry = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
          models[model] = entry;
        }
        entry.input += usage.input;
        entry.cacheRead += usage.cacheRead;
        entry.cacheWrite += usage.cacheWrite;
        entry.output += usage.output;
      }
      for (const key of ['ttftSum', 'ttftCount', 'decodeMs', 'decodeTokens', 'toolCalls', 'toolErrors']) {
        totals[key] += bucket[key];
      }
    }
    const total = tokens.input + tokens.cacheRead + tokens.cacheWrite + tokens.output;
    if (total > 0 || session.createdAt >= startTs) {
      sessions.push({
        id: session.id,
        title: session.title,
        workspace: session.cwd ? workspaceByPath.get(normalizePath(session.cwd)) ?? null : null,
        createdAt: session.createdAt,
        lastActiveAt: session.lastTime,
        activeMs,
        turns,
        tokens: { ...tokens, total },
        cost: costOf(tokens, pricing),
      });
    }
    if (total > 0) {
      for (const key of ['input', 'cacheRead', 'cacheWrite', 'output']) totals[key] += tokens[key];
      totals.turns += turns;
      totals.turnMs += activeMs;
      for (const [model, usage] of Object.entries(models)) {
        let entry = modelTotals.get(model);
        if (entry === undefined) {
          entry = { model, input: 0, cacheRead: 0, cacheWrite: 0, output: 0, sessions: new Set() };
          modelTotals.set(model, entry);
        }
        for (const key of ['input', 'cacheRead', 'cacheWrite', 'output']) entry[key] += usage[key];
        entry.sessions.add(session.id);
      }
    }
  }

  for (const point of points) {
    point.total = point.input + point.cacheRead + point.cacheWrite + point.output;
    point.cost = costOf(point, pricing);
    delete point.ttftSum;
    delete point.ttftCount;
    delete point.decodeMs;
    delete point.decodeTokens;
    delete point.toolCalls;
    delete point.toolErrors;
    delete point.turns;
    delete point.turnMs;
  }

  const totalTokens = totals.input + totals.cacheRead + totals.cacheWrite + totals.output;
  const totalCost = costOf(totals, pricing);
  const sessionCount = sessions.length;
  const cacheDenominator = totals.input + totals.cacheRead;
  const models = [...modelTotals.values()]
    .map((entry) => {
      const tokens = entry.input + entry.cacheRead + entry.cacheWrite + entry.output;
      return {
        model: entry.model,
        tokens,
        cost: costOf(entry, pricing),
        sessionCount: entry.sessions.size,
      };
    })
    .filter((entry) => entry.tokens > 0)
    .sort((left, right) => right.tokens - left.tokens);

  sessions.sort((left, right) => right.tokens.total - left.tokens.total || right.activeMs - left.activeMs);

  return {
    range: rangeId in RANGES ? rangeId : '7d',
    bucket: definition.bucket,
    startAt: startTs,
    generatedAt: Date.now(),
    sessionCount,
    totals: {
      input: totals.input,
      cacheRead: totals.cacheRead,
      cacheWrite: totals.cacheWrite,
      output: totals.output,
      total: totalTokens,
      cost: totalCost,
      averagePrice: totalTokens > 0 ? (totalCost / totalTokens) * 1000000 : 0,
    },
    cacheHitRate: cacheDenominator > 0 ? (totals.cacheRead / cacheDenominator) * 100 : 0,
    series: points,
    sessions: sessions.slice(0, MAX_SESSIONS),
    perf: {
      turns: totals.turns,
      avgTurnMs: totals.turns > 0 ? totals.turnMs / totals.turns : 0,
      ttftMs: totals.ttftCount > 0 ? totals.ttftSum / totals.ttftCount : 0,
      ttftSamples: totals.ttftCount,
      outputSpeed: totals.decodeMs > 0 ? totals.decodeTokens / (totals.decodeMs / 1000) : 0,
      toolCalls: totals.toolCalls,
      toolErrors: totals.toolErrors,
      toolErrorRate: totals.toolCalls > 0 ? (totals.toolErrors / totals.toolCalls) * 100 : 0,
    },
    models,
    totalSessions: fold.total,
    failedSessions: fold.failed,
  };
}

/**
 * Price a token bundle.
 * @param {{input:number,cacheRead:number,cacheWrite:number,output:number}} usage - Token counts.
 * @param {object} pricing - Resolved prices.
 * @returns {number} Estimated cost in CNY.
 */
export function costOf(usage, pricing) {
  return (
    (numberOr0(usage.input) * pricing.input +
      numberOr0(usage.cacheRead) * pricing.cacheRead +
      numberOr0(usage.cacheWrite) * pricing.cacheWrite +
      numberOr0(usage.output) * pricing.output) /
    1000000
  );
}

/**
 * Build the JSON route response.
 * @param {object} ctx - Host context.
 * @param {object} store - Fold store.
 * @param {object} runtime - Runtime sampler.
 * @param {object} pricing - Resolved prices.
 * @param {Request} request - Buffered request from the GUI.
 * @returns {Promise<Response>}
 */
async function handleRequest(ctx, store, runtime, pricing, request) {
  if (request.headers.get('x-dsh-session-stats') !== REQUEST_MARKER) {
    return reply(400, { code: 'bad_request', message: '缺少统计校验头。' });
  }
  let body = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const range = typeof body?.range === 'string' && Object.prototype.hasOwnProperty.call(RANGES, body.range) ? body.range : '7d';
  try {
    const result = await store.read({ force: body?.refresh === true });
    const view = buildView(result.fold, range, pricing, workspaceTitleMap(ctx));
    return new Response(JSON.stringify({ ok: true, view, runtime: runtime.snapshot(), rate: pricing.cnyPerUsd, stale: result.stale }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch (error) {
    ctx.logger?.warn?.(`session-stats: reading sessions failed: ${String(error?.message ?? error)}`);
    return reply(500, { code: 'stats_failed', message: String(error?.message ?? error) });
  }
}

/**
 * JSON error response.
 * @param {number} status - HTTP status.
 * @param {{code:string,message:string}} error - Failure payload.
 * @returns {Response}
 */
function reply(status, error) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** Sample process and machine runtime facts every five seconds. */
function createRuntimeSampler() {
  const state = {
    cpuCore: 0,
    cpuMachine: 0,
    loopP99: 0,
    loopMean: 0,
    lastCpu: process.cpuUsage(),
    lastWall: Date.now(),
    lastTimes: cpuTimes(),
    histogram: null,
  };
  const sample = () => {
    const now = Date.now();
    const usage = process.cpuUsage(state.lastCpu);
    const wallMicros = Math.max(now - state.lastWall, 1) * 1000;
    state.lastCpu = process.cpuUsage();
    state.lastWall = now;
    state.cpuCore = clampPercent(((usage.user + usage.system) / wallMicros) * 100);
    const times = cpuTimes();
    let idle = 0;
    let total = 0;
    for (let index = 0; index < times.length; index += 1) {
      const previous = state.lastTimes[index] ?? { idle: times[index].idle, total: times[index].total };
      idle += Math.max(times[index].idle - previous.idle, 0);
      total += Math.max(times[index].total - previous.total, 0);
    }
    state.lastTimes = times;
    state.cpuMachine = total > 0 ? clampPercent((1 - idle / total) * 100) : 0;
    if (state.histogram !== null) {
      state.loopP99 = state.histogram.percentile(99) / 1e6;
      state.loopMean = state.histogram.mean / 1e6;
      state.histogram.reset();
    }
  };
  return {
    start(ctx) {
      try {
        state.histogram = monitorEventLoopDelay({ resolution: 20 });
        state.histogram.enable();
      } catch {
        state.histogram = null;
      }
      state.lastCpu = process.cpuUsage();
      state.lastWall = Date.now();
      state.lastTimes = cpuTimes();
      const disposer = ctx.interval(sample, SAMPLE_MS);
      return () => {
        if (typeof disposer === 'function') disposer();
        if (state.histogram !== null) {
          state.histogram.disable();
          state.histogram = null;
        }
      };
    },
    snapshot() {
      const memory = process.memoryUsage();
      const load = os.loadavg();
      return {
        cpuCore: state.cpuCore,
        cpuMachine: state.cpuMachine,
        cores: os.cpus().length || 1,
        load1: Number.isFinite(load[0]) ? load[0] : 0,
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        loopP99: state.loopP99,
        loopMean: state.loopMean,
        uptimeMs: process.uptime() * 1000,
        pid: process.pid,
        node: process.version,
        platform: process.platform,
      };
    },
  };
}

/** Current CPU time counters per core. */
function cpuTimes() {
  return os.cpus().map((core) => ({
    idle: core.times.idle,
    total: core.times.user + core.times.nice + core.times.sys + core.times.idle + core.times.irq,
  }));
}

function clampPercent(value) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, 100 * 128);
}

function numberOr0(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Extract the first text run from a message-shaped event payload. */
function messageText(data) {
  if (!data || typeof data !== 'object') return '';
  const content = Array.isArray(data.content) ? data.content : Array.isArray(data.message?.content) ? data.message.content : [];
  const parts = [];
  for (const block of content) {
    if (block && block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Provider model label for one assistant message. */
function modelOf(data) {
  const source = data?.message?.source;
  if (!source || typeof source !== 'object' || typeof source.model !== 'string' || source.model.length === 0) return null;
  return source.model;
}

/**
 * First-token timestamp and decode time from stored stream records.
 * @param {object[]|undefined} stream - AssistantStreamRecord list.
 * @returns {{firstTokenAt: number|null, decodeMs: number}}
 */
function streamStats(stream) {
  let firstTokenAt = null;
  let decodeMs = 0;
  if (!Array.isArray(stream)) return { firstTokenAt, decodeMs };
  for (const record of stream) {
    if (!record || typeof record !== 'object') continue;
    if (typeof record.time0 === 'number' && (record.type === 'text-chunks' || record.type === 'reasoning-chunks')) {
      if (firstTokenAt === null || record.time0 < firstTokenAt) firstTokenAt = record.time0;
      if (Array.isArray(record.dt)) {
        for (const delta of record.dt) {
          if (typeof delta === 'number' && Number.isFinite(delta) && delta > 0) decodeMs += delta;
        }
      }
    }
  }
  return { firstTokenAt, decodeMs };
}

function bucketFor(map, time) {
  const key = Math.floor(time / HOUR_MS) * HOUR_MS;
  let bucket = map.get(key);
  if (bucket === undefined) {
    bucket = emptyBucket();
    map.set(key, bucket);
  }
  return bucket;
}

function startOfLocalDay(time) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function shiftLocalDays(time, days) {
  const date = new Date(time);
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function hourLabel(time) {
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, '0')}:00`;
}

function dayLabel(time) {
  const date = new Date(time);
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
