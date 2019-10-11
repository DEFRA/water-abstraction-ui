const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  getDay, getMonth
} = require('shared/modules/returns/models/return-date-helpers');

experiment('getDay', () => {
  test('extracts the day from an ISO date', async () => {
    expect(getDay('2019-05-21')).to.equal(21);
  });
});

experiment('getMonth', () => {
  test('extracts the month from an ISO date', async () => {
    expect(getMonth('2019-05-21')).to.equal(5);
  });
});
