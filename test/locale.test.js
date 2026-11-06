import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/client.js', import.meta.url), 'utf8');

test('client registers complete dictionaries for every shipped locale', () => {
  let factory = null;
  const windowMock = {
    __ModuleLoader__: {
      load(entry) {
        factory = entry.factory;
      },
    },
  };
  const documentMock = {
    createElement: () => ({ dataset: {}, textContent: '', remove() {} }),
    head: { appendChild() {} },
  };

  globalThis.window = windowMock;
  globalThis.document = documentMock;
  new Function(source)();
  assert.equal(typeof factory, 'function');

  class Component {
    constructor(props) {
      this.props = props;
      this.state = {};
    }
  }
  const react = {
    createElement: () => null,
    Fragment: Symbol('fragment'),
    Component,
    useState: () => [null, () => {}],
    useEffect: () => {},
    useRef: () => ({ current: null }),
  };
  const plugin = factory((name) => (name === 'react' ? react : {}));

  let captured = null;
  const ctx = {
    effect(callback) {
      const disposer = callback();
      return typeof disposer === 'function' ? disposer : () => {};
    },
    locale: {
      register(ns, dicts) {
        captured = { ns, dicts };
        return () => {};
      },
      bind: () => () => '',
      subscribe: () => () => {},
    },
    slots: {
      inject: () => () => {},
      register: () => () => {},
    },
    get: () => undefined,
  };
  plugin.apply(ctx);

  assert.ok(captured !== null, 'locale dictionaries were not registered');
  assert.equal(captured.ns, 'session-stats');
  const dictionaries = captured.dicts;
  const locales = Object.keys(dictionaries).sort();
  assert.deepEqual(locales, ['de', 'en', 'es', 'fr', 'ja', 'pt', 'ru', 'zh']);

  const baseline = Object.keys(dictionaries.zh).sort();
  assert.ok(baseline.length > 50, `unexpected key count ${baseline.length}`);
  for (const locale of locales) {
    assert.deepEqual(Object.keys(dictionaries[locale]).sort(), baseline, `${locale} key set`);
    for (const key of baseline) {
      const value = dictionaries[locale][key];
      assert.equal(typeof value, 'string', `${locale}.${key} is not a string`);
      assert.ok(value.length > 0, `${locale}.${key} is empty`);
    }
  }

  const placeholders = (text) => [...text.matchAll(/\{([a-z]+)\}/g)].map((match) => match[1]).sort();
  for (const locale of locales) {
    for (const key of baseline) {
      assert.deepEqual(
        placeholders(dictionaries[locale][key]),
        placeholders(dictionaries.zh[key]),
        `${locale}.${key} placeholders`,
      );
    }
  }
});
