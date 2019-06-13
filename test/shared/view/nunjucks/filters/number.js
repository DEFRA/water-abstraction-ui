'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const {
  number
} = require('../../../../../src/shared/view/nunjucks/filters/number');

experiment('number Nunjucks filter', () => {
  test('should truncate numbers to 3 dp', async () => {
    expect(number(10.4567)).to.equal('10.457');
  });
  test('should format thousands with commas', async () => {
    expect(number(10000)).to.equal('10,000');
  });
});
