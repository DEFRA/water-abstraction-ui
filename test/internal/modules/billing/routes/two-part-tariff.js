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

  experiment('.getLicenceReview', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getLicenceReview.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.getLicenceReview.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/{action}');
    });
  });

  experiment('.getBillingVolumeReview', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingVolumeReview.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.getBillingVolumeReview.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/billing-volume/{billingVolumeId}');
    });
  });

  experiment('.postBillingVolumeReview', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingVolumeReview.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.postBillingVolumeReview.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/billing-volume/{billingVolumeId}');
    });
  });

  experiment('.getConfirmQuantity', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getConfirmQuantity.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.getConfirmQuantity.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/billing-volume/{billingVolumeId}/confirm');
    });
  });

  experiment('.postConfirmQuantity', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postConfirmQuantity.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.postConfirmQuantity.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/billing-volume/{billingVolumeId}/confirm');
    });
  });

  experiment('.getRemoveLicence', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getRemoveLicence.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.getRemoveLicence.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/remove');
    });
  });

  experiment('.postRemoveLicence', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postRemoveLicence.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.postRemoveLicence.path)
        .to.equal('/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/remove');
    });
  });

  experiment('.getApproveReview', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getApproveReview.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.getApproveReview.path)
        .to.equal('/billing/batch/{batchId}/approve-review');
    });
  });

  experiment('.postApproveReview', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postApproveReview.config.auth.scope)
        .to.only.include([scope.billing]);
      expect(routes.postApproveReview.path)
        .to.equal('/billing/batch/{batchId}/approve-review');
    });
  });
});
