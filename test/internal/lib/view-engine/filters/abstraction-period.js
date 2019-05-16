'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  abstractionPeriod
} = require('../../../../../src/internal/lib/view-engine/filters/abstraction-period');

lab.experiment('abstractionPeriod Nunjucks filter', () => {
  lab.test('It should format a date and month in the form D/M to D MMMM', async () => {
    expect(abstractionPeriod('1/4')).to.equal('1 April');
    expect(abstractionPeriod('10/1')).to.equal('10 January');
    expect(abstractionPeriod('31/12')).to.equal('31 December');
  });

  lab.test('If should return null if null argument', async () => {
    expect(abstractionPeriod(null)).to.equal(null);
  });

  lab.test('If should throw an error if invalid date', async () => {
    const func = () => abstractionPeriod('32/13');
    expect(func).to.throw();
  });
});
