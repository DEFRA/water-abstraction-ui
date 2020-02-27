'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  abstractionPeriod
} = require('shared/view/nunjucks/filters/abstraction-period');

experiment('abstractionPeriod Nunjucks filter', () => {
  test('It should format a date and month in the form D/M to D MMMM', async () => {
    expect(abstractionPeriod('1/4')).to.equal('1 April');
    expect(abstractionPeriod('10/1')).to.equal('10 January');
    expect(abstractionPeriod('31/12')).to.equal('31 December');
  });

  test('If should return undefined if null argument', async () => {
    expect(abstractionPeriod(null)).to.be.undefined();
  });

  test('If should throw an error if invalid date', async () => {
    const func = () => abstractionPeriod('32/13');
    expect(func).to.throw();
  });

  test('It should return a formatted string if object provided', async () => {
    const obj = {
      startDay: 5,
      startMonth: 7,
      endDay: 23,
      endMonth: 12
    };
    const str = abstractionPeriod(obj);
    expect(str).to.equal('5 July to 23 December');
  });
});
