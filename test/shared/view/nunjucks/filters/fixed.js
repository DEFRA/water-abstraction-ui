'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const { fixed } = require('../../../../../src/shared/view/nunjucks/filters/fixed');

experiment('fixed Nunjucks filter', () => {
  test('It should accept an integer argument and format to fixed precision', async () => {
    expect(fixed(5, 2)).to.equal('5.00');
  });

  test('It should accept a float argument and format to fixed precision', async () => {
    expect(fixed(2.456, 2)).to.equal('2.46');
  });

  test('It should accept a string argument and format to fixed precision', async () => {
    expect(fixed('23.891', 1)).to.equal('23.9');
  });
});
