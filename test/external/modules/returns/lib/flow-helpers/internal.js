'use strict';
const { expect } = require('code');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

const steps = require('external/modules/returns/lib/flow-helpers/steps');
const internal = require('external/modules/returns/lib/flow-helpers/internal');
const data = require('./test-data.json');

experiment('internal returns flow: ', () => {
  experiment('for STEP_INTERNAL_ROUTING', () => {
    test('previous step is STEP_LICENCES', async () => {
      const result = internal.previous[steps.STEP_INTERNAL_ROUTING]();
      expect(result).to.equal(steps.STEP_LICENCES);
    });

    test('next step is STEP_LOG_RECEIPT if "log receipt" selected', async () => {
      const data = { action: 'log_receipt' };
      const result = internal.next[steps.STEP_INTERNAL_ROUTING](data);
      expect(result).to.equal(steps.STEP_LOG_RECEIPT);
    });

    test('next step is STEP_DATE_RECEIVED date if "enter and submit" selected', async () => {
      const data = { action: 'submit' };
      const result = internal.next[steps.STEP_INTERNAL_ROUTING](data);
      expect(result).to.equal(steps.STEP_DATE_RECEIVED);
    });

    test('next step is STEP_QUERY_LOGGED date if "log query" selected', async () => {
      const data = { action: 'set_under_query' };
      const result = internal.next[steps.STEP_INTERNAL_ROUTING](data);
      expect(result).to.equal(steps.STEP_QUERY_LOGGED);
    });

    test('next step is STEP_QUERY_LOGGED date if "resolve query" selected', async () => {
      const data = { action: 'clear_under_query' };
      const result = internal.next[steps.STEP_INTERNAL_ROUTING](data);
      expect(result).to.equal(steps.STEP_QUERY_LOGGED);
    });
  });

  experiment('for STEP_DATE_RECEIVED', () => {
    test('previous step is STEP_INTERNAL_ROUTING', async () => {
      const result = internal.previous[steps.STEP_DATE_RECEIVED]();
      expect(result).to.equal(steps.STEP_INTERNAL_ROUTING);
    });

    test('next step is STEP_START', async () => {
      const result = internal.next[steps.STEP_DATE_RECEIVED]();
      expect(result).to.equal(steps.STEP_START);
    });
  });

  experiment('for STEP_START', () => {
    test('previous step is STEP_DATE_RECEIVED', async () => {
      const result = internal.previous[steps.STEP_START]();
      expect(result).to.equal(steps.STEP_DATE_RECEIVED);
    });

    test('next step is STEP_NIL_RETURN when isNil is true', async () => {
      const data = { isNil: true };
      const result = internal.next[steps.STEP_START](data);
      expect(result).to.equal(steps.STEP_NIL_RETURN);
    });

    test('next step is STEP_INTERNAL_METHOD when isNil is false', async () => {
      const data = { isNil: false };
      const result = internal.next[steps.STEP_START](data);
      expect(result).to.equal(steps.STEP_INTERNAL_METHOD);
    });
  });

  experiment('for STEP_INTERNAL_METHOD', () => {
    test('previous step is STEP_START', async () => {
      const result = internal.previous[steps.STEP_INTERNAL_METHOD]();
      expect(result).to.equal(steps.STEP_START);
    });

    test('next step is STEP_UNITS', async () => {
      const result = internal.next[steps.STEP_INTERNAL_METHOD]();
      expect(result).to.equal(steps.STEP_UNITS);
    });
  });

  experiment('for STEP_UNITS', async () => {
    test('previous step is STEP_INTERNAL_METHOD', async () => {
      const result = internal.previous[steps.STEP_UNITS]();
      expect(result).to.equal(steps.STEP_INTERNAL_METHOD);
    });

    test('next step is STEP_METER_DETAILS_PROVIDED', async () => {
      const result = internal.next[steps.STEP_UNITS]();
      expect(result).to.equal(steps.STEP_METER_DETAILS_PROVIDED);
    });
  });

  experiment('for STEP_METER_DETAILS_PROVIDED', () => {
    test('previous step is STEP_UNITS', async () => {
      const result = internal.previous[steps.STEP_METER_DETAILS_PROVIDED]();
      expect(result).to.equal(steps.STEP_UNITS);
    });

    test('next step is STEP_METER_DETAILS if provided', async () => {
      const result = internal.next[steps.STEP_METER_DETAILS_PROVIDED](data.withMeterDetails);
      expect(result).to.equal(steps.STEP_METER_DETAILS);
    });

    test('next step is STEP_METER_READINGS if meter readings', async () => {
      const result = internal.next[steps.STEP_METER_DETAILS_PROVIDED](data.meterReadings);
      expect(result).to.equal(steps.STEP_METER_READINGS);
    });

    test('next step is STEP_METER_USED if abstraction volumes', async () => {
      const result = internal.next[steps.STEP_METER_DETAILS_PROVIDED](data.volumes);
      expect(result).to.equal(steps.STEP_METER_USED);
    });
  });

  experiment('for STEP_METER_USED', () => {
    test('previous step is STEP_METER_DETAILS_PROVIDED', async () => {
      const result = internal.previous[steps.STEP_METER_USED]();
      expect(result).to.equal(steps.STEP_METER_DETAILS_PROVIDED);
    });

    test('next step is STEP_SINGLE_TOTAL', async () => {
      const result = internal.next[steps.STEP_METER_USED](data.withMeterDetails);
      expect(result).to.equal(steps.STEP_SINGLE_TOTAL);
    });
  });

  experiment('for STEP_METER_DETAILS', () => {
    test('previous step is STEP_METER_DETAILS_PROVIDED', async () => {
      const result = internal.previous[steps.STEP_METER_DETAILS]();
      expect(result).to.equal(steps.STEP_METER_DETAILS_PROVIDED);
    });

    test('next step is STEP_METER_READINGS if meter readings', async () => {
      const result = internal.next[steps.STEP_METER_DETAILS](data.meterReadings);
      expect(result).to.equal(steps.STEP_METER_READINGS);
    });

    test('next step is STEP_SINGLE_TOTAL if abstraction volumes', async () => {
      const result = internal.next[steps.STEP_METER_DETAILS](data.volumes);
      expect(result).to.equal(steps.STEP_SINGLE_TOTAL);
    });
  });

  experiment('for STEP_METER_READINGS', () => {
    test('previous step is STEP_METER_DETAILS if details provided', async () => {
      const result = internal.previous[steps.STEP_METER_READINGS](data.withMeterDetails);
      expect(result).to.equal(steps.STEP_METER_DETAILS);
    });

    test('previous step is STEP_METER_DETAILS_PROVIDED if no details provided', async () => {
      const result = internal.previous[steps.STEP_METER_READINGS](data.withoutMeterDetails);
      expect(result).to.equal(steps.STEP_METER_DETAILS_PROVIDED);
    });

    test('next step is STEP_CONFIRM', async () => {
      const result = internal.next[steps.STEP_METER_READINGS]();
      expect(result).to.equal(steps.STEP_CONFIRM);
    });
  });

  experiment('for STEP_CONFIRM', () => {
    test('previous step is STEP_METER_READINGS if meter readings', async () => {
      const result = internal.previous[steps.STEP_CONFIRM](data.meterReadings);
      expect(result).to.equal(steps.STEP_METER_READINGS);
    });

    test('previous step is STEP_QUANTITIES if abstraction volumes', async () => {
      const result = internal.previous[steps.STEP_CONFIRM](data.volumes);
      expect(result).to.equal(steps.STEP_QUANTITIES);
    });

    test('next step is STEP_CONFIRM', async () => {
      const result = internal.next[steps.STEP_CONFIRM]();
      expect(result).to.equal(steps.STEP_SUBMITTED);
    });
  });

  experiment('for STEP_SINGLE_TOTAL', () => {
    test('previous step is STEP_METER_USED if no meter details', async () => {
      const result = internal.previous[steps.STEP_SINGLE_TOTAL](data.withoutMeterDetails);
      expect(result).to.equal(steps.STEP_METER_USED);
    });

    test('previous step is STEP_METER_DETAILS if meter details provided', async () => {
      const result = internal.previous[steps.STEP_SINGLE_TOTAL](data.withMeterDetails);
      expect(result).to.equal(steps.STEP_METER_DETAILS);
    });

    test('next step is STEP_SINGLE_TOTAL_DATES if single total', async () => {
      const result = internal.next[steps.STEP_SINGLE_TOTAL](data.singleTotal);
      expect(result).to.equal(steps.STEP_SINGLE_TOTAL_DATES);
    });

    test('next step is STEP_QUANTITIES if not single total', async () => {
      const result = internal.next[steps.STEP_SINGLE_TOTAL]();
      expect(result).to.equal(steps.STEP_QUANTITIES);
    });
  });

  experiment('for STEP_SINGLE_TOTAL_DATES', () => {
    test('previous step is STEP_SINGLE_TOTAL', async () => {
      const result = internal.previous[steps.STEP_SINGLE_TOTAL_DATES]();
      expect(result).to.equal(steps.STEP_SINGLE_TOTAL);
    });

    test('next step is STEP_QUANTITIES', async () => {
      const result = internal.next[steps.STEP_SINGLE_TOTAL_DATES]();
      expect(result).to.equal(steps.STEP_QUANTITIES);
    });
  });

  experiment('for STEP_QUANTITIES', () => {
    test('previous step is STEP_SINGLE_TOTAL if not single total', async () => {
      const result = internal.previous[steps.STEP_QUANTITIES]();
      expect(result).to.equal(steps.STEP_SINGLE_TOTAL);
    });

    test('previous step is STEP_SINGLE_TOTAL_DATES if single total', async () => {
      const result = internal.previous[steps.STEP_QUANTITIES](data.singleTotal);
      expect(result).to.equal(steps.STEP_SINGLE_TOTAL_DATES);
    });

    test('next step is STEP_CONFIRM', async () => {
      const result = internal.next[steps.STEP_QUANTITIES]();
      expect(result).to.equal(steps.STEP_CONFIRM);
    });
  });

  experiment('for STEP_LOG_RECEIPT', () => {
    test('next step is STEP_RECEIPT_LOGGED', async () => {
      const result = internal.next[steps.STEP_LOG_RECEIPT]();
      expect(result).to.equal(steps.STEP_RECEIPT_LOGGED);
    });

    test('previous step is STEP_INTERNAL_ROUTING', async () => {
      const result = internal.previous[steps.STEP_LOG_RECEIPT]();
      expect(result).to.equal(steps.STEP_INTERNAL_ROUTING);
    });
  });
});
