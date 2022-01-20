'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { purpose, time, abstraction, source, quantities } = require('../../../../../../src/internal/modules/charge-information/lib/charge-elements/mappers');
const { SOURCES, EIUC_SOURCE_OTHER } = require('../../../../../../src/internal/modules/charge-information/lib/charge-elements/constants');

experiment('internal/modules/charge-information/lib/charge-elements/mappers', () => {
  experiment('.purpose', () => {
    const defaultCharges = [
      { purposeUse: { id: 'test-purpose-use-1-id', description: 'test description 1' },
        purposePrimary: { id: 'test-purpose-primary-1-id' },
        purposeSecondary: { id: 'test-purpose-secondary-1-id' }
      },
      { purposeUse: { id: 'test-purpose-use-2-id', description: 'test description 2' },
        purposePrimary: { id: 'test-purpose-primary-2-id' },
        purposeSecondary: { id: 'test-purpose-secondary-2-id' },
        scheme: 'alcs'
      }
    ];
    const result = purpose({ purpose: 'test-purpose-use-2-id' }, defaultCharges);

    test('the correct purpose use and related primary and secondary uses are returned', () => {
      expect(result).to.be.equal(defaultCharges[1]);
    });
  });

  experiment('.time', () => {
    test('when timelimitedPeriod = yes, start and end dates are mapped correctly', () => {
      const timeLimitFormValues = {
        timeLimitedPeriod: 'yes',
        startDate: '2001-01-01',
        endDate: '2001-01-31'
      };
      const result = time(timeLimitFormValues);
      expect(result).to.be.equal({ timeLimitedPeriod: { startDate: '2001-01-01', endDate: '2001-01-31' } });
    });

    test('when timelimitedPeriod = no, the time limited period is set to null', () => {
      const timeLimitFormValues = {
        timeLimitedPeriod: 'no'
      };
      const result = time(timeLimitFormValues);
      expect(result).to.be.equal({ timeLimitedPeriod: null });
    });
  });

  experiment('.abstraction', () => {
    const abstractionFormValues = {
      startDate: '01-15',
      endDate: '08-31'
    };
    const result = abstraction(abstractionFormValues);
    test('the abstraction period is mapped correctly', () => {
      expect(result).to.be.equal({ abstractionPeriod: { startDay: '15', startMonth: '01', endDay: '31', endMonth: '08' } });
    });
  });

  experiment('.source', () => {
    test('when the source is "tidal", eiuc source is set to "tidal"', () => {
      const result = source({ source: SOURCES.tidal });
      expect(result).to.be.equal({ source: SOURCES.tidal, eiucSource: SOURCES.tidal });
    });

    test('when the source is any other value, eiuc source is set to "other"', () => {
      const result = source({ source: SOURCES.supported });
      expect(result).to.be.equal({ source: SOURCES.supported, eiucSource: EIUC_SOURCE_OTHER });
    });
  });

  experiment('.quantities', () => {
    test('converts authorised quantity to float', () => {
      const result = quantities({ authorisedAnnualQuantity: '123.456' });
      expect(result.authorisedAnnualQuantity).to.be.equal(123.456);
    });

    test('sets billable quantity to null if is empty', () => {
      const result = quantities({ authorisedAnnualQuantity: '123.456', billableAnnualQuantity: '' });
      expect(result.billableAnnualQuantity).to.be.null();
    });

    test('converts billable quantity to float if provided', () => {
      const result = quantities({ authorisedAnnualQuantity: '123.456', billableAnnualQuantity: '45.6' });
      expect(result.billableAnnualQuantity).to.be.equal(45.6);
    });
  });
});
