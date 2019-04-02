'use strict';

const moment = require('moment');
const { beforeEach, test, experiment } = exports.lab = require('lab').script();
const { omit, set } = require('lodash');

const { expect } = require('code');
const testReturn = require('./test-return');

const {
  checkMeterDetails,
  isDateWithinAbstractionPeriod,
  getLinesWithReadings,
  getMeter,
  applyExternalUser,
  applyMeterDetails,
  applyMeterDetailsProvided,
  applyMeterReadings,
  applyMeterReset,
  applyMeterUnits,
  applyMethod,
  applyNilReturn,
  applyQuantities,
  applyReadingType,
  applyReceivedDate,
  applySingleTotal,
  applySingleTotalAbstractionDates,
  applyStatus,
  applyUnderQuery,
  applyUserDetails,
  applyMultiplication,
  applyCleanup
} = require('../../../../src/modules/returns/lib/return-helpers');

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

const getTestReturnWithMeter = (meter = {
  startReading: 100,
  multiplier: 1,
  units: 'm³'
}) => {
  return Object.assign({}, testReturn, { meters: [meter] });
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

experiment('Return reducers', () => {
  test('applyQuantities should set the lines array', async () => {
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

  test('applyQuantities should ignore lines for dates that are not expected', async () => {
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

  test('applyNilReturn set nil flag and remove lines', async () => {
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

  test('applyExternalUser should clear the total value options from the return', async () => {
    const data = applySingleTotal(testReturn, 100);
    const data2 = applyExternalUser(data);

    expect(data2.reading.totalFlag).to.equal(false);
    expect(data2.reading.total).to.equal(null);
  });

  test('applyStatus should set status and received date if received date is null', async () => {
    const data = applyStatus(testReturn, 'due');

    expect(data.status).to.equal('due');
    expect(data.receivedDate).to.equal(moment().format('YYYY-MM-DD'));
  });

  test('applyStatus should set status and received date if received date is null', async () => {
    const data = applyStatus(testReturn, 'due');
    data.receivedDate = '2017-06-06';

    const data2 = applyStatus(data, 'completed');

    expect(data2.status).to.equal('completed');
    expect(data2.receivedDate).to.equal('2017-06-06');
  });

  test('applyStatus should throw error if invalid status', async () => {
    const func = () => {
      applyStatus(testReturn, 'the-dog-chewed-it-up');
    };
    expect(func).to.throw();
  });

  test('applyUserDetails should set user details on the return object', async () => {
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

experiment('applyMeterDetails', () => {
  let data;
  let formValues;

  beforeEach(async () => {
    formValues = {
      manufacturer: 'test-manufacturer',
      serialNumber: 'test-serial',
      csrf_token: 'c7c72434-5844-4827-25d5-6dac3c31136d'
    };
    data = applyMeterDetails({}, formValues);
  });

  test('adds the manufacturer', async () => {
    expect(data.meters[0].manufacturer).to.equal('test-manufacturer');
  });

  test('adds the serial number', async () => {
    expect(data.meters[0].serialNumber).to.equal('test-serial');
  });

  test('sets multiplier to 1 if undefined', async () => {
    expect(data.meters[0].multiplier).to.equal(1);
  });

  test('sets multiplier to 10 if true', async () => {
    formValues.isMultiplier = ['multiply'];
    data = applyMeterDetails({}, formValues);
    expect(data.meters[0].multiplier).to.equal(10);
  });

  test('does not overwrite existing readings', async () => {
    const earlierData = {
      meters: [{
        readings: {
          one: 1
        }
      }]
    };
    const latestData = applyMeterDetails(earlierData, formValues);
    expect(latestData.meters[0].readings.one).to.equal(1);
  });
});

experiment('applyMeterUnits', () => {
  const getFormValues = units => ({ units });

  test('assigns the units if "l"', async () => {
    const data = applyMeterUnits({}, getFormValues('l'));
    expect(data.meters[0].units).to.equal('l');
    expect(data.reading.units).to.equal('l');
  });

  test('assigns the units if "m³"', async () => {
    const data = applyMeterUnits({}, getFormValues('m³'));
    expect(data.meters[0].units).to.equal('m³');
    expect(data.reading.units).to.equal('m³');
  });

  test('assigns the units if "Ml"', async () => {
    const data = applyMeterUnits({}, getFormValues('Ml'));
    expect(data.meters[0].units).to.equal('Ml');
    expect(data.reading.units).to.equal('Ml');
  });

  test('assigns the units if "gal"', async () => {
    const data = applyMeterUnits({}, getFormValues('gal'));
    expect(data.meters[0].units).to.equal('gal');
    expect(data.reading.units).to.equal('gal');
  });

  test('throws for an unexpected value', async () => {
    expect(() => {
      applyMeterUnits({}, getFormValues('oz'));
    }).to.throw();
  });
});

experiment('applyMeterReadings', () => {
  test('keeps a copy of the readings against the meter', async () => {
    const returnData = getTestReturnWithMeter();

    const formValues = {
      '2017-11-01_2017-11-30': 1,
      '2017-12-01_2017-12-31': 2,
      '2018-01-01_2018-01-31': 3,
      csrf_token: '00000000-0000-0000-0000-000000000000'
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.meters[0].readings).to.equal(omit(formValues, 'csrf_token'));
  });

  test('adds the start reading number', async () => {
    const returnData = getTestReturnWithMeter();

    const formValues = {
      'startReading': 1544,
      '2017-11-01_2017-11-30': 1,
      '2017-12-01_2017-12-31': 2,
      '2018-01-01_2018-01-31': 3,
      csrf_token: '00000000-0000-0000-0000-000000000000'
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.meters[0].startReading).to.equal(1544);
  });

  test('sets abstraction volumes to 0 for null meter readings inside abstraction period, and null outside', async () => {
    const returnData = getTestReturnWithMeter();
    const formValues = {
      '2017-11-01_2017-11-30': null,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': null
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 0 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: null },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 0 }
    ]);
  });

  test('sets abstraction volumes based on the start reading', async () => {
    const returnData = getTestReturnWithMeter();
    const formValues = {
      'startReading': 100,
      '2017-11-01_2017-11-30': 150,
      '2017-12-01_2017-12-31': 250,
      '2018-01-01_2018-01-31': 255
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 50 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: 100 },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 5 }
    ]);
  });

  test('does not multiply values by the multiplier', async () => {
    const tenTimesMeter = { startReading: 100, multiplier: 10, units: 'm³' };
    const returnData = getTestReturnWithMeter(tenTimesMeter);
    const formValues = {
      'startReading': 100,
      '2017-11-01_2017-11-30': 150,
      '2017-12-01_2017-12-31': 250,
      '2018-01-01_2018-01-31': 255
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 50 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: 100 },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 5 }
    ]);
  });

  test('handles a mixture of null and numeric meter readings', async () => {
    const returnData = getTestReturnWithMeter();
    const formValues = {
      'startReading': 100,
      '2017-11-01_2017-11-30': 150,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': 255
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 50 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: null },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 105 }
    ]);
  });

  test('sets the volume to 0 for identical meter readings', async () => {
    const returnData = getTestReturnWithMeter();
    const formValues = {
      'startReading': 100,
      '2017-11-01_2017-11-30': 100,
      '2017-12-01_2017-12-31': 100,
      '2018-01-01_2018-01-31': 250
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 0 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: 0 },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 150 }
    ]);
  });
});

experiment('applyMethod', () => {
  test('adds the method to the reading object', async () => {
    const returnData = getTestReturnWithMeter();
    const data = applyMethod(returnData, 'oneMeter');
    expect(data.reading.method).to.equal('oneMeter');
  });

  test('when the method is meters the reading type is set to measured', async () => {
    const returnData = getTestReturnWithMeter();
    const data = applyMethod(returnData, 'oneMeter');
    expect(data.reading.type).to.equal('measured');
  });

  test('for volumes the meter details are removed', async () => {
    const data = {
      meters: [
        { readings: [], startReading: 100, units: 'l' },
        { readings: [], startReading: 101, units: 'l' }
      ]
    };
    const updated = applyMethod(data, 'abstractionVolumes');

    expect(updated.meters[0]).to.equal({});
    expect(updated.meters[1]).to.equal({});
  });
});

experiment('getMeter', () => {
  test('return an empty object when no meter data', async () => {
    expect(getMeter(testReturn)).to.equal({});
  });

  test('returns the meter if present', async () => {
    expect(getMeter(getTestReturnWithMeter())).to.equal({
      startReading: 100,
      multiplier: 1,
      units: 'm³'
    });
  });
});

experiment('getLinesWithReadings', () => {
  const meter = {
    startReading: 5,
    readings: {
      '2017-10-01_2017-10-31': 10,
      '2017-11-01_2017-11-30': 15,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': 17
    }
  };

  const lines = [{
    startDate: '2017-10-01',
    endDate: '2017-10-31',
    quantity: 5
  },
  {
    startDate: '2017-11-01',
    endDate: '2017-11-30',
    quantity: 5
  }, {
    startDate: '2017-12-01',
    endDate: '2017-12-31',
    quantity: null
  }, {
    startDate: '2018-01-01',
    endDate: '2018-01-31',
    quantity: 2
  }];

  test('returns lines unchanged if using volumes', async () => {
    const data = {
      reading: {
        method: 'abstractionVolumes'
      },
      meters: [meter],
      lines
    };
    expect(getLinesWithReadings(data)).to.equal(data.lines);
  });

  test('adds meter readings to lines if using one meter', async () => {
    const data = {
      reading: {
        method: 'oneMeter'
      },
      meters: [meter],
      lines
    };
    expect(getLinesWithReadings(data)).to.equal([ { startDate: '2017-10-01',
      endDate: '2017-10-31',
      quantity: 5,
      startReading: 5,
      endReading: 10 },
    { startDate: '2017-11-01',
      endDate: '2017-11-30',
      quantity: 5,
      startReading: 10,
      endReading: 15 },
    { startDate: '2017-12-01',
      endDate: '2017-12-31',
      quantity: null },
    { startDate: '2018-01-01',
      endDate: '2018-01-31',
      quantity: 2,
      startReading: 15,
      endReading: 17 } ]);
  });
});

experiment('applyUnderQuery', () => {
  test('set under query flag', async () => {
    const ret = applyUnderQuery(testReturn, { isUnderQuery: true });
    expect(ret.isUnderQuery).to.equal(true);
  });
  test('clear under query flag', async () => {
    const ret = applyUnderQuery(testReturn, { isUnderQuery: false });
    expect(ret.isUnderQuery).to.equal(false);
  });
});

experiment('applyMeterReset', () => {
  const returnData = method => {
    return {
      reading: {
        method
      },
      meters: [{
        startReading: 5,
        readings: {
          '2017-10-01_2017-10-31': 10,
          '2017-11-01_2017-11-30': 15,
          '2017-12-01_2017-12-31': null,
          '2018-01-01_2018-01-31': 17
        },
        units: 'L'
      }]
    };
  };
  test('updates reading.method to "oneMeter" if meterReset is false', async () => {
    const data = applyMeterReset(returnData('abstractionVolumes'), { meterReset: false });
    expect(data.reading.method).to.equal('oneMeter');
  });

  test('updates reading.method to "abstractionVolumes" if meterReset is true', async () => {
    const data = applyMeterReset(returnData('oneMeter'), { meterReset: true });
    expect(data.reading.method).to.equal('abstractionVolumes');
  });
});

experiment('applyReceivedDate', () => {
  test('sets the received date', async () => {
    const formValues = {
      'receivedDate': '2018-05-25'
    };
    const ret = applyReceivedDate(testReturn, formValues);
    expect(ret.receivedDate).to.equal('2018-05-25');
  });
});

experiment('applyMeterDetailsProvided', () => {
  test('sets a meter if details are to be provided', async () => {
    const formValues = { meterDetailsProvided: true };
    const data = {};
    const applied = applyMeterDetailsProvided(data, formValues);

    expect(applied.meters[0]).to.equal({
      multiplier: 1,
      meterDetailsProvided: true
    });
  });

  test('leaves existing meter details if details are to be provided', async () => {
    const formValues = { meterDetailsProvided: true };
    const data = {
      meters: [{ startReading: 100, multiplier: 10, units: 'm³' }]
    };
    const applied = applyMeterDetailsProvided(data, formValues);

    expect(applied.meters[0]).to.equal({
      startReading: 100,
      multiplier: 10,
      units: 'm³',
      meterDetailsProvided: true
    });
  });

  test('sets an empty meter if no details are to be provided', async () => {
    const formValues = { meterDetailsProvided: false };
    const data = {};
    const applied = applyMeterDetailsProvided(data, formValues);

    expect(applied.meters[0]).to.equal({
      multiplier: 1,
      meterDetailsProvided: false
    });
  });

  test('clears an existing meter if details are not to be provded', async () => {
    const formValues = { meterDetailsProvided: false };
    const data = {
      meters: [{ startReading: 100, multiplier: 1, units: 'm³' }]
    };
    const applied = applyMeterDetailsProvided(data, formValues);

    expect(applied.meters[0]).to.equal({
      multiplier: 1,
      meterDetailsProvided: false
    });
  });

  // the multiplier is required by the water service validation
  test('by defaults sets the multiplier to one', async () => {
    const formValues = { meterDetailsProvided: false };
    const data = {};
    const applied = applyMeterDetailsProvided(data, formValues);

    expect(applied.meters[0].multiplier).to.equal(1);
  });
});

experiment('applySingleTotal', () => {
  test('for a single value the value and flag are set', async () => {
    const returnData = { reading: {} };
    const formValues = { isSingleTotal: true, total: 1000 };
    const applied = applySingleTotal(returnData, formValues);
    expect(applied).to.equal({
      reading: {
        totalFlag: true,
        total: 1000
      }
    });
  });

  test('if setting to mutliple values any existing total value is removed', async () => {
    const returnData = {
      reading: {
        totalFlag: true,
        total: 200
      }
    };
    const formValues = { isSingleTotal: false };
    const applied = applySingleTotal(returnData, formValues);
    expect(applied).to.equal({
      reading: {
        totalFlag: false,
        total: undefined
      }
    });
  });
});

experiment('applySingleTotalAbstractionDates', () => {
  test('sets the data for a default period', async () => {
    const formValues = {
      totalCustomDates: false
    };

    const data = {
      reading: {},
      metadata: {
        nald: {}
      }
    };

    const applied = applySingleTotalAbstractionDates(data, formValues);

    expect(applied.reading.totalCustomDates).to.be.false();
    expect(applied.reading.totalCustomDateStart).to.be.null();
    expect(applied.reading.totalCustomDateEnd).to.be.null();
  });

  test('makes start and end null when changing to default period', async () => {
    const formValues = {
      totalCustomDates: false
    };

    const data = {
      reading: {
        totalCustomDates: true,
        totalCustomDateStart: '2018-01-01T03:02:01+00:00',
        totalCustomDateEnd: '2018-01-02T03:02:01+00:00'
      },
      metadata: {
        nald: {}
      }
    };

    const applied = applySingleTotalAbstractionDates(data, formValues);

    expect(applied.reading.totalCustomDates).to.be.false();
    expect(applied.reading.totalCustomDateStart).to.be.null();
    expect(applied.reading.totalCustomDateEnd).to.be.null();
  });

  test('sets the data for a custom period', async () => {
    const formValues = {
      totalCustomDates: true,
      totalCustomDateStart: '2018-01-01T03:02:01+00:00',
      totalCustomDateEnd: '2018-01-02T03:02:01+00:00'
    };

    const data = {
      reading: {}
    };

    const applied = applySingleTotalAbstractionDates(data, formValues);

    expect(applied.reading.totalCustomDates).to.be.true();
    expect(applied.reading.totalCustomDateStart).to.equal('2018-01-01');
    expect(applied.reading.totalCustomDateEnd).to.equal('2018-01-02');
  });

  test('updates lines to match abstraction period for default abstraction period', async () => {
    const formValues = { totalCustomDates: false };

    testReturn.reading.total = 100;
    testReturn.reading.totalFlag = true;

    const data = applySingleTotalAbstractionDates(testReturn, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01',
        endDate: '2017-11-30',
        period: 'month',
        quantity: 50 },
      { startDate: '2017-12-01',
        endDate: '2017-12-31',
        period: 'month',
        quantity: null },
      { startDate: '2018-01-01',
        endDate: '2018-01-31',
        period: 'month',
        quantity: 50 }
    ]);
  });

  test('updates lines to match abstraction period for custom abstraction period', async () => {
    const formValues = {
      totalCustomDates: true,
      totalCustomDateStart: '2017-12-01',
      totalCustomDateEnd: '2018-01-01'
    };

    testReturn.reading.total = 100;
    testReturn.reading.totalFlag = true;

    const data = applySingleTotalAbstractionDates(testReturn, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01',
        endDate: '2017-11-30',
        period: 'month',
        quantity: null },
      { startDate: '2017-12-01',
        endDate: '2017-12-31',
        period: 'month',
        quantity: 100 },
      { startDate: '2018-01-01',
        endDate: '2018-01-31',
        period: 'month',
        quantity: null }
    ]);
  });
});

experiment('applyReadingType', () => {
  test('sets reading type', async () => {
    const data = applyReadingType({}, 'measured');
    expect(data.reading.type).to.equal('measured');
  });
});

experiment('checkMeterDetails', () => {
  test('sets the meters to an empty array for estimates', async () => {
    const data = {
      reading: {
        type: 'estimated'
      }
    };

    expect(checkMeterDetails(data)).to.equal({
      reading: {
        type: 'estimated'
      },
      meters: []
    });
  });

  test('does not overwrite meters for measured', async () => {
    const data = {
      reading: {
        type: 'measured'
      },
      meters: [
        { example: 'test' }
      ]
    };

    expect(checkMeterDetails(data)).to.equal({
      reading: {
        type: 'measured'
      },
      meters: [
        { example: 'test' }
      ]
    });
  });

  test('does nothing for no reading', async () => {
    const data = {};
    expect(checkMeterDetails(data)).to.equal({});
  });
});

experiment('applyMultiplication', () => {
  test('does not apply multiplication to volumes', async () => {
    const ret = {
      ...testReturn,
      lines: [{
        quantity: 5
      }]
    };
    const result = applyMultiplication(ret);
    expect(result.lines[0].quantity).to.equal(5);
  });

  test('does not apply multiplication for nil returns', async () => {
    const ret = {
      ...testReturn,
      isNil: true
    };
    const result = applyMultiplication(ret);
    expect(result.lines).to.equal(undefined);
  });

  test('applies multiplier for oneMeter', async () => {
    const ret = getTestReturnWithMeter({
      multiplier: 5
    });
    ret.lines = [{
      quantity: 5
    }];
    set(ret, 'reading.method', 'oneMeter');
    const result = applyMultiplication(ret);
    expect(result.lines[0].quantity).to.equal(25);
  });
});

experiment('applyCleanup', () => {
  const createReturn = () => ({
    reading: {
      totalFlag: true
    },
    meters: [{
      meterDetailsProvided: false
    }],
    requiredLines: [],
    versions: []
  });

  const createRequest = isInternal => ({
    auth: {
      credentials: {
        scope: [isInternal ? 'internal' : 'external']
      }
    }
  });

  test('removes requiredLines and versions', async () => {
    const result = applyCleanup(createReturn(), createRequest());
    const keys = Object.keys(result);
    expect(keys).to.not.include(['requiredLines', 'versions']);
  });

  experiment('for external users', () => {
    test('sets reading.totalFlag to false', async () => {
      const result = applyCleanup(createReturn(), createRequest());
      expect(result.reading.totalFlag).to.equal(false);
    });

    test('sets meters[].meterDetailsProvided to true', async () => {
      const result = applyCleanup(createReturn(), createRequest());
      expect(result.meters[0].meterDetailsProvided).to.equal(true);
    });

    test('ignores the meters if they are undefined (nil return)', async () => {
      const result = applyCleanup({}, createRequest());
      expect(result.meters).to.be.undefined();
    });
  });

  experiment('for internal users', () => {
    test('does not change reading.totalFlag', async () => {
      const result = applyCleanup(createReturn(), createRequest(true));
      expect(result.reading.totalFlag).to.equal(true);
    });

    test('does not set meters[].meterDetailsProvided', async () => {
      const result = applyCleanup(createReturn(), createRequest(true));
      expect(result.meters[0].meterDetailsProvided).to.equal(false);
    });
  });
});
