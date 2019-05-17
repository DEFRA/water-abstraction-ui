'use strict';
const { expect } = require('code');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

const steps = require('../../../../../../src/internal/modules/returns/lib/flow-helpers/steps');
const external = require('../../../../../../src/internal/modules/returns/lib/flow-helpers/external');
const data = require('./test-data.json');

experiment('external returns flow: ', () => {
  experiment('for STEP_START', () => {
    test('previous step is STEP_RETURNS', async () => {
      const result = external.previous[steps.STEP_START]();
      expect(result).to.equal(steps.STEP_RETURNS);
    });

    test('next step is STEP_NIL_RETURN when isNil is true', async () => {
      const result = external.next[steps.STEP_START](data.nilReturn);
      expect(result).to.equal(steps.STEP_NIL_RETURN);
    });

    test('next step is STEP_METHOD otherwise', async () => {
      const result = external.next[steps.STEP_START]();
      expect(result).to.equal(steps.STEP_METHOD);
    });
  });

  experiment('for STEP_NIL_RETURN', () => {
    test('previous step is STEP_START', async () => {
      const result = external.previous[steps.STEP_NIL_RETURN]();
      expect(result).to.equal(steps.STEP_START);
    });

    test('next step is STEP_SUBMITTED', async () => {
      const result = external.next[steps.STEP_NIL_RETURN]();
      expect(result).to.equal(steps.STEP_SUBMITTED);
    });
  });

  experiment('for STEP_METHOD', () => {
    test('previous step is STEP_START', async () => {
      const result = external.previous[steps.STEP_METHOD]();
      expect(result).to.equal(steps.STEP_START);
    });

    test('next step is STEP_METER_RESET if one meter', async () => {
      const result = external.next[steps.STEP_METHOD](data.meterReadings);
      expect(result).to.equal(steps.STEP_METER_RESET);
    });

    test('next step is STEP_UNITS otherwise', async () => {
      const result = external.next[steps.STEP_METHOD]();
      expect(result).to.equal(steps.STEP_UNITS);
    });
  });

  experiment('for STEP_METER_RESET', () => {
    test('previous step is STEP_METHOD', async () => {
      const result = external.previous[steps.STEP_METER_RESET]();
      expect(result).to.equal(steps.STEP_METHOD);
    });

    test('next step is STEP_UNITS', async () => {
      const result = external.next[steps.STEP_METER_RESET]();
      expect(result).to.equal(steps.STEP_UNITS);
    });
  });

  experiment('for STEP_UNITS', () => {
    test('previous step is STEP_METER_RESET if oneMeter', async () => {
      const result = external.previous[steps.STEP_UNITS](data.meterReadings);
      expect(result).to.equal(steps.STEP_METER_RESET);
    });

    test('previous step is STEP_METHOD if volumes', async () => {
      const result = external.previous[steps.STEP_UNITS](data.volumes);
      expect(result).to.equal(steps.STEP_METHOD);
    });

    test('next step is STEP_METER_READINGS if oneMeter', async () => {
      const result = external.next[steps.STEP_UNITS](data.meterReadings);
      expect(result).to.equal(steps.STEP_METER_READINGS);
    });

    test('next step is STEP_QUANTITIES if volumes', async () => {
      const result = external.next[steps.STEP_UNITS](data.volumes);
      expect(result).to.equal(steps.STEP_QUANTITIES);
    });
  });

  experiment('for STEP_METER_READINGS', () => {
    test('previous step is STEP_UNITS', async () => {
      const result = external.previous[steps.STEP_METER_READINGS]();
      expect(result).to.equal(steps.STEP_UNITS);
    });

    test('next step is STEP_METER_DETAILS', async () => {
      const result = external.next[steps.STEP_METER_READINGS]();
      expect(result).to.equal(steps.STEP_METER_DETAILS);
    });
  });

  experiment('for STEP_QUANTITIES', () => {
    test('previous step is STEP_UNITS', async () => {
      const result = external.previous[steps.STEP_QUANTITIES]();
      expect(result).to.equal(steps.STEP_UNITS);
    });

    test('next step is STEP_METER_DETAILS if measured', async () => {
      const result = external.next[steps.STEP_QUANTITIES](data.measured);
      expect(result).to.equal(steps.STEP_METER_DETAILS);
    });

    test('next step is STEP_CONFIRM otherwise', async () => {
      const result = external.next[steps.STEP_QUANTITIES]();
      expect(result).to.equal(steps.STEP_CONFIRM);
    });
  });

  experiment('for STEP_METER_DETAILS', () => {
    test('previous step is STEP_METER_READINGS if oneMeter', async () => {
      const result = external.previous[steps.STEP_METER_DETAILS](data.meterReadings);
      expect(result).to.equal(steps.STEP_METER_READINGS);
    });

    test('previous step is STEP_QUANTITIES otherwise', async () => {
      const result = external.previous[steps.STEP_METER_DETAILS]();
      expect(result).to.equal(steps.STEP_QUANTITIES);
    });

    test('next step is STEP_CONFIRM', async () => {
      const result = external.next[steps.STEP_METER_DETAILS]();
      expect(result).to.equal(steps.STEP_CONFIRM);
    });
  });

  experiment('for STEP_CONFIRM', () => {
    test('previous step is STEP_METER_DETAILS if measured', async () => {
      const result = external.previous[steps.STEP_CONFIRM](data.measured);
      expect(result).to.equal(steps.STEP_METER_DETAILS);
    });

    test('previous step is STEP_METER_READINGS if oneMeter', async () => {
      const result = external.previous[steps.STEP_CONFIRM](data.meterReadings);
      expect(result).to.equal(steps.STEP_METER_READINGS);
    });

    test('previous step is STEP_QUANTITIES if volumes', async () => {
      const result = external.previous[steps.STEP_CONFIRM](data.volumes);
      expect(result).to.equal(steps.STEP_QUANTITIES);
    });

    test('next step is STEP_SUBMITTED', async () => {
      const result = external.next[steps.STEP_CONFIRM]();
      expect(result).to.equal(steps.STEP_SUBMITTED);
    });
  });
});
