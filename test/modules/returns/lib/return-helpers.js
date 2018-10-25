'use strict';

const Lab = require('lab');
const moment = require('moment');
const { beforeEach, experiment, test } = exports.lab = Lab.script();
const { omit } = require('lodash');

const { expect } = require('code');
const testReturn = require('./test-return');

const {
  isDateWithinAbstractionPeriod, applySingleTotal, applyBasis,
  applyQuantities, applyNilReturn, applyExternalUser, applyStatus,
  applyUserDetails, applyMeterDetails, applyMeterUnits, applyMeterReadings,
  applyMethod, getMeter, getLinesWithReadings
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
  test('applySingleTotal should apply a single total abstraction amount and update lines to match abstraction period', async () => {
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

  test('applyBasis should set the estimated/measured property', async () => {
    const data = applyBasis(testReturn, {basis: 'estimated'});
    expect(data.reading.type).to.equal('estimated');
  });

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
      startReading: 1544,
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

  test('adds the start reading number', async () => {
    expect(data.meters[0].startReading).to.equal(1544);
  });

  test('sets multiplier to 1 if undefined', async () => {
    expect(data.meters[0].multiplier).to.equal(1);
  });

  test('sets multiplier to 10 if true', async () => {
    formValues.isMultiplier = true;
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

  test('sets reading type to measured', async () => {
    const data = applyMeterUnits({}, getFormValues('gal'));
    expect(data.reading.type).to.equal('measured');
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

  test('sets abstraction volumes to zero for null meter readings', async () => {
    const returnData = getTestReturnWithMeter();
    const formValues = {
      '2017-11-01_2017-11-30': null,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': null
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 0 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: 0 },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 0 }
    ]);
  });

  test('sets abstraction volumes based on the start reading', async () => {
    const returnData = getTestReturnWithMeter();
    const formValues = {
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

  test('handles the multiplier', async () => {
    const tenTimesMeter = { startReading: 100, multiplier: 10, units: 'm³' };
    const returnData = getTestReturnWithMeter(tenTimesMeter);
    const formValues = {
      '2017-11-01_2017-11-30': 150,
      '2017-12-01_2017-12-31': 250,
      '2018-01-01_2018-01-31': 255
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 500 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: 1000 },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 50 }
    ]);
  });

  test('handles a mixture of null and numeric meter readings', async () => {
    const returnData = getTestReturnWithMeter();
    const formValues = {
      '2017-11-01_2017-11-30': 150,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': 255
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 50 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: 0 },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 105 }
    ]);
  });

  test('sets the volume to zero for identical meter readings', async () => {
    const returnData = getTestReturnWithMeter();
    const formValues = {
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

  test('handles the start reading being zero', async () => {
    const zeroMeter = { startReading: 0, multiplier: 1, units: 'm³' };
    const returnData = getTestReturnWithMeter(zeroMeter);
    const formValues = {
      '2017-11-01_2017-11-30': 0,
      '2017-12-01_2017-12-31': 250,
      '2018-01-01_2018-01-31': 255
    };

    const data = applyMeterReadings(returnData, formValues);

    expect(data.lines).to.equal([
      { startDate: '2017-11-01', endDate: '2017-11-30', period: 'month', quantity: 0 },
      { startDate: '2017-12-01', endDate: '2017-12-31', period: 'month', quantity: 250 },
      { startDate: '2018-01-01', endDate: '2018-01-31', period: 'month', quantity: 5 }
    ]);
  });
});

experiment('applyMethod', () => {
  test('adds the method to the reading object', async () => {
    const returnData = getTestReturnWithMeter();
    const data = applyMethod(returnData, 'oneMeter');
    expect(data.reading.method).to.equal('oneMeter');
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
