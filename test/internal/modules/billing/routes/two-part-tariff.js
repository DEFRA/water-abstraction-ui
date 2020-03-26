'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/billing/routes/two-part-tariff');

experiment('internal/modules/billing/routes/two-part-tarriff', () => {
  experiment('.getBillingTwoPartTariffReview', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingTwoPartTariffReview.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.getBillingTwoPartTariffReview.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff-review');
    });
  });
  experiment('.getBillingTwoPartTariffReady', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingTwoPartTariffReady.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.getBillingTwoPartTariffReady.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff-ready');
    });
  });
});
