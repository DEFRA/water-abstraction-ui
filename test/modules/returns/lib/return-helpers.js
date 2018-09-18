'use strict';

const Lab = require('lab');
const moment = require('moment');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
const testReturn = require('./test-return');

const { isDateWithinAbstractionPeriod, applySingleTotal, applyBasis, applyQuantities, applyNilReturn, applyExternalUser, applyStatus, applyUserDetails } = require('../../../../src/modules/returns/lib/return-helpers');

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

lab.experiment('Test isDateWithinAbstractionPeriod', () => {
  lab.test('Period start/end in same year', async () => {
    expect(isDateWithinAbstractionPeriod('2018-01-01', sameYear)).to.equal(false);
    expect(isDateWithinAbstractionPeriod('2018-03-04', sameYear)).to.equal(false);
    expect(isDateWithinAbstractionPeriod('2018-03-05', sameYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-12-25', sameYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-12-26', sameYear)).to.equal(false);
    expect(isDateWithinAbstractionPeriod('2018-12-31', sameYear)).to.equal(false);
  });

  lab.test('Period start/end in different year', async () => {
    expect(isDateWithinAbstractionPeriod('2018-09-30', differentYear)).to.equal(false);
    expect(isDateWithinAbstractionPeriod('2018-10-01', differentYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-12-31', differentYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2019-01-01', differentYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2019-06-08', differentYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2019-06-09', differentYear)).to.equal(false);
  });

  lab.test('Period all year', async () => {
    expect(isDateWithinAbstractionPeriod('2017-12-31', allYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-01-01', allYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2018-12-31', allYear)).to.equal(true);
    expect(isDateWithinAbstractionPeriod('2019-01-01', allYear)).to.equal(true);
  });
});

lab.experiment('Return reducers', () => {
  lab.test('applySingleTotal should apply a single total abstraction amount and update lines to match abstraction period', async () => {
    const data = applySingleTotal(testReturn, 100);
    expect(data.reading.totalFlag).to.equal(true);
    expect(data.reading.total).to.equal(100);
    expect(data.lines).to.equal([
      { startDate: '2017-11-01',
        endDate: '2017-11-30',
        period: 'month',
        quantity: 50 },
      { startDate: '2017-12-01',
        endDate: '2017-12-31',
        period: 'month',
        quantity: 0 },
      { startDate: '2018-01-01',
        endDate: '2018-01-31',
        period: 'month',
        quantity: 50 } ]);
  });

  lab.test('applyBasis should set the estimated/measured property', async () => {
    const data = applyBasis(testReturn, {basis: 'estimated'});
    expect(data.reading.type).to.equal('estimated');
  });

  lab.test('applyQuantities should set the lines array', async () => {
    const data = applyQuantities(testReturn, {
      '2017-11-01_2017-11-30': 15,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': 10.456
    });
    expect(data.lines).to.equal([ {
      startDate: '2017-11-01',
      endDate: '2017-11-30',
      period: 'month',
      quantity: 15 },
    { startDate: '2017-12-01',
      endDate: '2017-12-31',
      period: 'month',
      quantity: null },
    { startDate: '2018-01-01',
      endDate: '2018-01-31',
      period: 'month',
      quantity: 10.456 } ]);
  });

  lab.test('applyQuantities should ignore lines for dates that are not expected', async () => {
    const data = applyQuantities(testReturn, {
      '1035-01-01_1035-01-31': null,
      '2017-11-01_2017-11-30': 15,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': 10.456,
      '2019-01-01_2019-01-31': 103349343
    });
    expect(data.lines).to.equal([ {
      startDate: '2017-11-01',
      endDate: '2017-11-30',
      period: 'month',
      quantity: 15 },
    { startDate: '2017-12-01',
      endDate: '2017-12-31',
      period: 'month',
      quantity: null },
    { startDate: '2018-01-01',
      endDate: '2018-01-31',
      period: 'month',
      quantity: 10.456 } ]);
  });

  lab.test('applyNilReturn set nil flag and remove lines', async () => {
    const data = applyQuantities(testReturn, {
      '1035-01-01_1035-01-31': null,
      '2017-11-01_2017-11-30': 15,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': 10.456,
      '2019-01-01_2019-01-31': 103349343
    });

    const data2 = applyNilReturn(data, true);

    expect(data2.lines).to.equal(undefined);
    expect(data2.isNil).to.equal(true);
  });

  lab.test('applyExternalUser should clear the total value options from the return', async () => {
    const data = applySingleTotal(testReturn, 100);
    const data2 = applyExternalUser(data);

    expect(data2.reading.totalFlag).to.equal(false);
    expect(data2.reading.total).to.equal(null);
  });

  lab.test('applyStatus should set status and received date if received date is null', async () => {
    const data = applyStatus(testReturn, 'due');

    expect(data.status).to.equal('due');
    expect(data.receivedDate).to.equal(moment().format('YYYY-MM-DD'));
  });

  lab.test('applyStatus should set status and received date if received date is null', async () => {
    const data = applyStatus(testReturn, 'due');
    data.receivedDate = '2017-06-06';

    const data2 = applyStatus(data, 'completed');

    expect(data2.status).to.equal('completed');
    expect(data2.receivedDate).to.equal('2017-06-06');
  });

  lab.test('applyUserDetails should set user details on the return object', async () => {
    const data = applyUserDetails(testReturn, {
      username: 'test@example.com',
      scope: ['internal', 'returns'],
      entity_id: '01234'
    });

    expect(data.user.email).to.equal('test@example.com');
    expect(data.user.type).to.equal('internal');
    expect(data.user.entityId).to.equal('01234');
  });
});
