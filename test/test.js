import multiEntry, { entry } from '../';
import { ok } from 'assert';
import { rollup } from 'rollup';

function includes(string, substring) {
  if (string.indexOf(substring) < 0) {
    ok(false, `expected ${JSON.stringify(string)} to include ${JSON.stringify(substring)}`);
  }
}

function doesNotInclude(string, substring) {
  if (string.indexOf(substring) >= 0) {
    ok(false, `expected ${JSON.stringify(string)} not to include ${JSON.stringify(substring)}`);
  }
}

function makeBundle(entries, useOldAPI) {
  return rollup(
      !useOldAPI ?
      { entry: entries, plugins: [multiEntry()] } :
      { entry, plugins: [multiEntry(entries)] }
  );
}

function setupTests(options) {
  const useOldAPI = options ? options.useOldAPI : false;

  it('takes a single file as input', () =>
    makeBundle('test/fixtures/0.js', useOldAPI).then(bundle => {
      includes(bundle.generate({ format: 'cjs' }).code, 'exports.zero = zero;');
    })
  );

  it('takes an array of files as input', () =>
    makeBundle(['test/fixtures/0.js', 'test/fixtures/1.js'], useOldAPI).then(bundle => {
      const code = bundle.generate({ format: 'cjs' }).code;
      includes(code, 'exports.zero = zero;');
      includes(code, 'exports.one = one;');
    })
  );

  it('allows an empty array as input', () =>
    makeBundle([], useOldAPI).then(bundle => {
      const code = bundle.generate({ format: 'cjs' }).code;
      doesNotInclude(code, 'exports');
    })
  );

  it('takes a glob as input', () =>
    makeBundle('test/fixtures/{0,1}.js', useOldAPI).then(bundle => {
      const code = bundle.generate({ format: 'cjs' }).code;
      includes(code, 'exports.zero = zero;');
      includes(code, 'exports.one = one;');
    })
  );

  it('takes an array of globs as input', () =>
    makeBundle(['test/fixtures/{0,}.js', 'test/fixtures/{1,}.js'], useOldAPI).then(bundle => {
      const code = bundle.generate({ format: 'cjs' }).code;
      includes(code, 'exports.zero = zero;');
      includes(code, 'exports.one = one;');
    })
  );

  it('takes an {include,exclude} object as input', () =>
    makeBundle(
      { include: ['test/fixtures/*.js'], exclude: ['test/fixtures/1.js'] },
      useOldAPI
    ).then(bundle => {
      const code = bundle.generate({ format: 'cjs' }).code;
      includes(code, 'exports.zero = zero;');
      doesNotInclude(code, 'exports.one = one;');
    })
  );

  it('allows to prevent exporting', () =>
    makeBundle(
      { include: ['test/fixtures/*.js'], exports: false },
      useOldAPI
    ).then(bundle => {
      const code = bundle.generate({ format: 'iife' }).code;
      includes(code, `console.log('Hello, 2');`)
      doesNotInclude(code, 'zero');
      doesNotInclude(code, 'one');
    })
  );
}

describe('rollup-plugin-multi-entry', () => {
  setupTests({ useOldAPI: false });

  describe('with old API', () => {
    setupTests({ useOldAPI: true });
  });
});
