'use strict';
const { expect } = require('code');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

const helpers = require('internal/modules/returns/lib/flow-helpers/helpers');
const data = require('./test-data.json');

experiment('Returns flow helpers', () => {
  experiment('isMeterDetailsProvided', () => {
    test('returns true if meter details provided flag set', async () => {
      const result = helpers.isMeterDetailsProvided(data.withMeterDetails);
      expect(result).to.equal(true);
    });
    test('returns false otherwise', async () => {
      const result = helpers.isMeterDetailsProvided(data.withoutMeterDetails);
      expect(result).to.equal(false);
    });
  });

  experiment('isVolumes', () => {
    test('returns true if volumes', async () => {
      const result = helpers.isVolumes(data.volumes);
      expect(result).to.equal(true);
    });
    test('returns false otherwise', async () => {
      const result = helpers.isVolumes(data.meterReadings);
      expect(result).to.equal(false);
    });
  });

  experiment('isOneMeter', () => {
    test('returns true if method is oneMeter', async () => {
      const result = helpers.isOneMeter(data.meterReadings);
      expect(result).to.equal(true);
    });
    test('returns false otherwise', async () => {
      const result = helpers.isOneMeter(data.volumes);
      expect(result).to.equal(false);
    });
  });

  experiment('isNil', () => {
    test('returns true if nil return', async () => {
      const result = helpers.isNil(data.nilReturn);
      expect(result).to.equal(true);
    });
    test('returns false otherwise', async () => {
      const result = helpers.isNil(data.volumes);
      expect(result).to.equal(false);
    });
  });

  experiment('isSingleTotal', () => {
    test('returns true if single total', async () => {
      const result = helpers.isSingleTotal(data.singleTotal);
      expect(result).to.equal(true);
    });
    test('returns false otherwise', async () => {
      const result = helpers.isSingleTotal(data.volumes);
      expect(result).to.equal(false);
    });
  });

  experiment('isMeasured', () => {
    test('returns true if measured', async () => {
      const result = helpers.isMeasured(data.measured);
      expect(result).to.equal(true);
    });
    test('returns false otherwise', async () => {
      const result = helpers.isMeasured(data.estimated);
      expect(result).to.equal(false);
    });
  });
});
