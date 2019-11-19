const controller = require('./controller');
const { billing } = require('internal/lib/constants').scope;
const allowedScopes = [billing];

module.exports = {
  getBillingBatchType: {
    method: 'GET',
    path: '/billing/batch/type',
    handler: controller.getBillingBatchType,
    options: {
      auth: { scope: allowedScopes }
    }
  },
  postBillingBatchType: {
    method: 'POST',
    path: '/billing/batch/type',
    handler: controller.postBillingBatchType,
    options: {
      auth: { scope: allowedScopes }
    }
  },

  getBillingBatchRegion: {
    method: 'GET',
    path: '/billing/batch/region/{billingType}',
    handler: controller.getBillingBatchRegion,
    options: {
      auth: { scope: allowedScopes }
    }
  },
  postBillingBatchRegion: {
    method: 'POST',
    path: '/billing/batch/region',
    handler: controller.postBillingBatchRegion,
    options: {
      auth: { scope: allowedScopes }
    }
  }
};
