'use strict';

const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const {
  slice
} = require('../../../../src/lib/view-engine/filters/slice.js');

experiment('slice Nunjucks filter', () => {
  const str = 'The quick brown fox jumps over the lazy dog.';

  test('should slice the supplied string from the start', async () => {
    const result = slice(str, 4, 9);
    expect(result).to.equal('quick');
  });

  test('should slice the supplied string from the end', async () => {
    const result = slice(str, -4, -1);
    expect(result).to.equal('dog');
  });
});
