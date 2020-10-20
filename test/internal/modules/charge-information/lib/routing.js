'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const queryString = require('querystring');

const routing = require('internal/modules/charge-information/lib/routing');

experiment('internal/modules/charge-information/lib/routing', () => {
  let licence, licenceHolderRole;

  beforeEach(async () => {
    licence = {
      id: 'test-licence-id',
      region: {
        id: 'test-region-id'
      }
    };
    licenceHolderRole = {
      company: {
        id: 'test-company-id'
      }
    };
  });

  experiment('.getChargeElementStep', () => {
    test('returns the correct url', async () => {
      const url = routing.getChargeElementStep(licence.id, 'test-element-id', 'test-step');
      expect(url).to.equal('/licences/test-licence-id/charge-information/charge-element/test-element-id/test-step');
    });
  });

  experiment('.getSubmitted', () => {
    test('returns the correct url', async () => {
      const url = routing.getSubmitted(licence.id, true);
      expect(url).to.equal('/licences/test-licence-id/charge-information/submitted?chargeable=true');
    });
  });

  experiment('.getCreateBillingAccount', () => {
    test('returns the correct url', async () => {
      const expectedQueryString = queryString.stringify({
        redirectPath: '/licences/test-licence-id/charge-information/check',
        licenceId: 'test-licence-id'
      });
      const url = routing.getCreateBillingAccount(licence, licenceHolderRole, 'check');
      const [base, query] = url.split('?');
      expect(base).to.equal('/invoice-accounts/create/test-region-id/test-company-id');
      expect(query).to.equal(expectedQueryString);
    });

    experiment('.getCheckData', () => {
      test('returns the correct url', async () => {
        const url = routing.getCheckData(licence.id);
        expect(url).to.equal('/licences/test-licence-id/charge-information/check');
      });
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

  experiment('.getNonChargeableReason', () => {
    test('returns the correct url', async () => {
      const url = routing.getNonChargeableReason(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/non-chargeable-reason');
    });
  });

  experiment('.getCancelData', () => {
    test('returns the correct url', async () => {
      const url = routing.getCancelData(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/cancel');
    });
  });
});
