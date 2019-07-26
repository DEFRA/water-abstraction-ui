const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  isDateWithinAbstractionPeriod, getDay, getMonth
} = require('shared/modules/returns/models/return-date-helpers');

const sameYear = {
  periodStartDay: 5,
  periodStartMonth: 3,
  periodEndDay: 25,
  periodEndMonth: 12
};

const differentYear = {
  periodStartDay: 1,
  periodStartMonth: 10,
  periodEndDay: 8,
  periodEndMonth: 6
};

const allYear = {
  periodStartDay: 1,
  periodStartMonth: 1,
  periodEndDay: 31,
  periodEndMonth: 12
};

experiment('Test isDateWithinAbstractionPeriod', () => {
  test('Period start/end in same year', async () => {
    expect(isDateWithinAbstractionPeriod('2018-01-01', sameYear)).to.equal(false);
    expect(isDateWithinAbstractionPeriod('2018-03-04', sameYear)).to.equal(false);
    expect(isDateWithinAbstractionPeriod('2018-03-05', sameYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-12-25', sameYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-12-26', sameYear)).to.equal(false);
    expect(isDateWithinAbstractionPeriod('2018-12-31', sameYear)).to.equal(false);
  });

  test('Period start/end in different year', async () => {
    expect(isDateWithinAbstractionPeriod('2018-09-30', differentYear)).to.equal(false);
    expect(isDateWithinAbstractionPeriod('2018-10-01', differentYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-12-31', differentYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2019-01-01', differentYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2019-06-08', differentYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2019-06-09', differentYear)).to.equal(false);
  });

  test('Period all year', async () => {
    expect(isDateWithinAbstractionPeriod('2017-12-31', allYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-01-01', allYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-12-31', allYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2019-01-01', allYear)).to.equal(true);
  });
});

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
