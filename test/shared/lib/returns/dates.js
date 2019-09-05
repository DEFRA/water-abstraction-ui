'use strict';

const moment = require('moment');

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const dates = require('shared/lib/returns/dates');

experiment('isReturnPastDueDate', () => {
  test('is true when the due date is before today', async () => {
    const yesterday = moment().add(-1, 'days').format('YYYY-MM-DD');
    expect(dates.isReturnPastDueDate({ due_date: yesterday })).to.be.true();
  });

  test('is false when the due date is today', async () => {
    const today = moment().format('YYYY-MM-DD');
    expect(dates.isReturnPastDueDate({ due_date: today })).to.be.false();
  });

  test('is false when the due date is after today', async () => {
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
    expect(dates.isReturnPastDueDate({ due_date: tomorrow })).to.be.false();
  });
});
