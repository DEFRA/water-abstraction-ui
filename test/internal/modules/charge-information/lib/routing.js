'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const routing = require('internal/modules/charge-information/lib/routing');

experiment('internal/modules/charge-information/lib/routing', () => {
  let licence;

  beforeEach(async () => {
    licence = {
      id: 'test-licence-id'
    };
  });

  experiment('.getCheckData', () => {
    test('returns the correct url', async () => {
      const url = routing.getCheckData(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/check');
    });
  });

  experiment('.getCreateBillingAccount', () => {
    test('returns the correct url', async () => {
      const url = routing.getCreateBillingAccount(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/billing-account/create');
    });
  });

  experiment('.getNonChargeableReason', () => {
    test('returns the correct url', async () => {
      const url = routing.getNonChargeableReason(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/non-chargeable-reason');
    });
  });

  experiment('.getReason', () => {
    test('returns the correct url', async () => {
      const url = routing.getReason(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/create');
    });
  });

  experiment('.getStartDate', () => {
    test('returns the correct url', async () => {
      const url = routing.getStartDate(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/start-date');
    });
  });

  experiment('.getSelectBillingAccount', () => {
    test('returns the correct url', async () => {
      const url = routing.getSelectBillingAccount(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/billing-account');
    });
  });

  experiment('.getUseAbstractionData', () => {
    test('returns the correct url', async () => {
      const url = routing.getUseAbstractionData(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/use-abstraction-data');
    });
  });

  experiment('.getEffectiveDate', () => {
    test('returns the correct url', async () => {
      const url = routing.getEffectiveDate(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/effective-date');
    });
  });
});
