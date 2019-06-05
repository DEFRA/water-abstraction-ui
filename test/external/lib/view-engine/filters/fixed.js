'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  fixed
} = require('../../../../../src/external/lib/view-engine/filters/fixed');

lab.experiment('fixed Nunjucks filter', () => {
  lab.test('It should accept an integer argument and format to fixed precision', async () => {
    expect(fixed(5, 2)).to.equal('5.00');
  });

  lab.test('It should accept a float argument and format to fixed precision', async () => {
    expect(fixed(2.456, 2)).to.equal('2.46');
  });

  lab.test('It should accept a string argument and format to fixed precision', async () => {
    expect(fixed('23.891', 1)).to.equal('23.9');
  });
});
