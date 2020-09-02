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
      const url = routing.getCheckData(licence);
      expect(url).to.equal('/licences/test-licence-id/charge-information/check');
    });
  });

  experiment('.getCreateBillingAccount', () => {
    test('returns the corrent url', async () => {
      const url = routing.getCreateBillingAccount(licence);
      expect(url).to.equal('/licences/test-licence-id/charge-information/billing-account/create');
    });
  });

  experiment('.getNonChargeableReason', () => {
    test('returns the corrent url', async () => {
      const url = routing.getNonChargeableReason(licence);
      expect(url).to.equal('/licences/test-licence-id/charge-information/non-chargeable-reason');
    });
  });

  experiment('.getReason', () => {
    test('returns the corrent url', async () => {
      const url = routing.getReason(licence);
      expect(url).to.equal('/licences/test-licence-id/charge-information/create');
    });
  });

  experiment('.getStartDate', () => {
    test('returns the corrent url', async () => {
      const url = routing.getStartDate(licence);
      expect(url).to.equal('/licences/test-licence-id/charge-information/start-date');
    });
  });

  experiment('.getSelectBillingAccount', () => {
    test('returns the corrent url', async () => {
      const url = routing.getSelectBillingAccount(licence);
      expect(url).to.equal('/licences/test-licence-id/charge-information/billing-account');
    });
  });

  experiment('.getUseAbstractionData', () => {
    test('returns the corrent url', async () => {
      const url = routing.getUseAbstractionData(licence);
      expect(url).to.equal('/licences/test-licence-id/charge-information/use-abstraction-data');
    });
  });
});
