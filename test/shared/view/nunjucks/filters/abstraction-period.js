'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const {
  abstractionPeriod
} = require('shared/view/nunjucks/filters/abstraction-period');

experiment('abstractionPeriod Nunjucks filter', () => {
  test('It should format a date and month in the form D/M to D MMMM', async () => {
    expect(abstractionPeriod('1/4')).to.equal('1 April');
    expect(abstractionPeriod('10/1')).to.equal('10 January');
    expect(abstractionPeriod('31/12')).to.equal('31 December');
  });

  test('If should return null if null argument', async () => {
    expect(abstractionPeriod(null)).to.equal(null);
  });

  test('If should throw an error if invalid date', async () => {
    const func = () => abstractionPeriod('32/13');
    expect(func).to.throw();
  });
});
