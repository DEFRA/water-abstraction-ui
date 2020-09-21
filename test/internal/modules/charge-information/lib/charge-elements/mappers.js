'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { purpose, time, abstraction } = require('../../../../../../src/internal/modules/charge-information/lib/charge-elements/mappers');

experiment('internal/modules/charge-information/lib/charge-elements/mappers', () => {
  experiment('.purpose', () => {
    const defaultCharges = [
      { purposeUse: { id: 'test-id', description: 'test description 1' } },
      { purposeUse: { id: 'another-id', description: 'test description 2' } }
    ];
    const result = purpose({ purpose: 'test-id' }, defaultCharges);
    test('the purpose use is mapped to the correct purpose use id', () => {
      expect(result).to.be.equal(defaultCharges[0]);
    });
  });
  experiment('.time', () => {
    const timeLimitFormValues = {
      timeLimitedPeriod: 'yes',
      startDate: '2001-01-01',
      endDate: '2001-01-31'
    };

    test('when timelimitedPeriod = yes', () => {
      const result = time(timeLimitFormValues);
      expect(result).to.be.equal({ timeLimitedPeriod: { startDate: '2001-01-01', endDate: '2001-01-31' } });
    });
    test('when timelimitedPeriod = yes', () => {
      timeLimitFormValues.timeLimitedPeriod = false;
      timeLimitFormValues.startDate = '';
      timeLimitFormValues.endDate = '';
      const result = time(timeLimitFormValues);
      expect(result).to.be.equal({ timeLimitedPeriod: false });
    });
  });
  experiment('.abstraction', () => {
    const abstractionFormValues = {
      startDate: '01-15',
      endDate: '08-31'
    };
    const result = abstraction(abstractionFormValues);
    test('the purpose use is mapped to the correct purpose use id', () => {
      expect(result).to.be.equal({ abstractionPeriod: { startDay: '15', startMonth: '01', endDay: '31', endMonth: '08' } });
    });
  });
});
