import test from 'node:test';
import assert from 'node:assert/strict';

import { buildView, costOf, foldSession, normalizePath } from '../src/index.js';

const PRICING = {
  input: 0.5,
  cacheRead: 0.05,
  cacheWrite: 0.5,
  output: 2,
  cnyPerUsd: 7.2,
};

const DAY_MS = 86400000;
const now = Date.now();
const recent = now - 2 * 3600000;

const recentEvents = [
  { type: 'user/message', seq: 1, time: recent - 1000, data: { role: 'user', content: [{ type: 'text', text: 'Hello world from the test' }] } },
  { type: 'turn/start', seq: 2, time: recent, data: { turn: 1 } },
  { type: 'step/start', seq: 3, time: recent + 1000, data: { turn: 1, step: 1 } },
  {
    type: 'assistant/message',
    seq: 4,
    time: recent + 3000,
    data: {
      turn: 1,
      step: 1,
      message: { role: 'assistant', content: [], source: { kind: 'model', provider: 'deepseek', model: 'deepseek-chat' } },
      usage: { inputTokens: 1000, cacheReadTokens: 5000, cacheWriteTokens: 0, outputTokens: 500 },
      stream: [{ type: 'text-chunks', time0: recent + 2500, dt: [100, 200, 300], texts: ['a', 'b', 'c'] }],
    },
  },
  { type: 'tool/call', seq: 5, time: recent + 3200, data: { turn: 1, step: 1, callId: 'c1', name: 'read', arguments: '{}' } },
  { type: 'tool/result', seq: 6, time: recent + 3400, data: { turn: 1, step: 1, message: { role: 'tool', content: [] }, error: { name: 'Error', code: 'E' } } },
  { type: 'turn/end', seq: 7, time: recent + 10000, data: { turn: 1, reason: { kind: 'completed' } } },
];

const oldDate = new Date();
oldDate.setMonth(oldDate.getMonth() - 5);
oldDate.setDate(5);
oldDate.setHours(9, 0, 0, 0);
const oldTime = oldDate.getTime();

const oldEvents = [
  { type: 'turn/start', seq: 1, time: oldTime, data: { turn: 1 } },
  {
    type: 'assistant/message',
    seq: 2,
    time: oldTime + 2000,
    data: {
      turn: 1,
      step: 1,
      message: { role: 'assistant', content: [], source: { kind: 'model', provider: 'deepseek', model: 'deepseek-chat' } },
      usage: { inputTokens: 100, cacheReadTokens: 200, cacheWriteTokens: 0, outputTokens: 50 },
    },
  },
  { type: 'turn/end', seq: 3, time: oldTime + 5000, data: { turn: 1, reason: { kind: 'completed' } } },
];

function makeFold() {
  const a = foldSession({ id: 'a', createdAt: recent - 1000, cwd: 'D:\\work\\proj' }, recentEvents, null);
  const b = foldSession({ id: 'b', createdAt: oldTime, cwd: 'D:\\work\\other' }, oldEvents, 'Five months ago');
  return { sessions: [a, b], total: 2, failed: 0, readAt: now };
}

test('foldSession keeps the title override, cwd, and first-message fallback', () => {
  const fold = foldSession({ id: 'a', createdAt: recent, cwd: 'D:\\work\\proj' }, recentEvents, null);
  assert.equal(fold.title, 'Hello world from the test');
  assert.equal(fold.cwd, 'D:\\work\\proj');
  assert.equal(fold.buckets.size, 1);

  const titled = foldSession({ id: 'b', createdAt: oldTime }, oldEvents, 'Project title');
  assert.equal(titled.title, 'Project title');
});

test('buildView aggregates tokens, cache, turns, latency, and workspace labels', () => {
  const view = buildView(makeFold(), 'all', PRICING, new Map([[normalizePath('D:\\work\\proj'), 'My Workspace']]));

  assert.equal(view.sessionCount, 2);
  assert.equal(view.totals.input, 1100);
  assert.equal(view.totals.cacheRead, 5200);
  assert.equal(view.totals.cacheWrite, 0);
  assert.equal(view.totals.output, 550);
  assert.equal(view.totals.total, 6850);
  assert.equal(view.series.reduce((sum, point) => sum + point.total, 0), 6850);
  assert.ok(Math.abs(view.cacheHitRate - (5200 / 6300) * 100) < 1e-9);
  assert.ok(Math.abs(view.perf.avgTurnMs - 7500) < 1e-9);
  assert.ok(Math.abs(view.perf.ttftMs - 1500) < 1e-9);
  assert.equal(view.perf.toolCalls, 1);
  assert.equal(view.perf.toolErrors, 1);
  assert.ok(Math.abs(view.perf.toolErrorRate - 100) < 1e-9);
  assert.ok(Math.abs(view.perf.outputSpeed - 500 / 0.6) < 1e-6);

  const expectedCost = (1100 * 0.5 + 5200 * 0.05 + 550 * 2) / 1e6;
  assert.ok(Math.abs(view.totals.cost - expectedCost) < 1e-12);
  assert.ok(Math.abs(view.totals.averagePrice - (expectedCost / 6850) * 1e6) < 1e-9);

  const recentSession = view.sessions.find((session) => session.id === 'a');
  assert.equal(recentSession.workspace, 'My Workspace');
  assert.equal(view.sessions[0].id, 'a');
});

test('ranges only include sessions inside their window', () => {
  const fold = makeFold();
  const day = buildView(fold, '24h', PRICING);
  assert.equal(day.sessionCount, 1);
  assert.equal(day.totals.total, 6500);
  assert.equal(day.series.length, 24);

  const month = buildView(fold, '30d', PRICING);
  assert.equal(month.sessionCount, 1);
  assert.equal(month.series.length, 30);
});

test('all time uses daily buckets from the earliest record', () => {
  const fold = makeFold();
  const view = buildView(fold, 'all', PRICING);
  const expectedDays = Math.round((new Date(now).setHours(0, 0, 0, 0) - new Date(oldTime).setHours(0, 0, 0, 0)) / DAY_MS) + 1;

  assert.equal(view.bucket, 'day');
  assert.equal(view.series.length, expectedDays);
  assert.equal(view.totals.total, 6850);
  assert.equal(view.sessionCount, 2);

  const oldDay = new Date(oldTime);
  const label = `${String(oldDay.getMonth() + 1).padStart(2, '0')}-${String(oldDay.getDate()).padStart(2, '0')}`;
  const point = view.series.find((entry) => entry.label === label);
  assert.ok(point !== undefined);
  assert.equal(point.total, 350);
});

test('empty data yields a stable zero view', () => {
  const view = buildView({ sessions: [], total: 0, failed: 0, readAt: now }, '7d', PRICING);
  assert.equal(view.sessionCount, 0);
  assert.equal(view.totals.total, 0);
  assert.equal(view.totals.averagePrice, 0);
  assert.equal(view.cacheHitRate, 0);
  assert.equal(view.series.length, 7);
});

test('costOf prices every token kind', () => {
  assert.equal(costOf({ input: 1000000, cacheRead: 0, cacheWrite: 0, output: 0 }, PRICING), 0.5);
  assert.equal(costOf({ input: 0, cacheRead: 1000000, cacheWrite: 0, output: 0 }, PRICING), 0.05);
  assert.equal(costOf({ input: 0, cacheRead: 0, cacheWrite: 0, output: 1000000 }, PRICING), 2);
});
