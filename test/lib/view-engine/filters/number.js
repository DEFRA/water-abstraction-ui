'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  number
} = require('../../../../src/lib/view-engine/filters/number.js');

lab.experiment('number Nunjucks filter', () => {
  lab.test('should truncate numbers to 3 dp', async () => {
    expect(number(10.4567)).to.equal('10.457');
  });
  lab.test('should format thousands with commas', async () => {
    expect(number(10000)).to.equal('10,000');
  });
});
