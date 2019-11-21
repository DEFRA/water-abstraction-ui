const controller = require('./controller');
const { billing } = require('internal/lib/constants').scope;
const allowedScopes = [billing];

module.exports = {
  getBillingBatchType: {
    method: 'GET',
    path: '/billing/batch/type',
    handler: controller.getBillingBatchType,
    options: {
      auth: { scope: allowedScopes },
      description: 'Form to select type of bill run e.g. annual'
    }
  },
  postBillingBatchType: {
    method: 'POST',
    path: '/billing/batch/type',
    handler: controller.postBillingBatchType,
    options: {
      auth: { scope: allowedScopes },
      description: 'post handler for select type'
    }
  },

  getBillingBatchRegion: {
    method: 'GET',
    path: '/billing/batch/region/{billingType}',
    handler: controller.getBillingBatchRegion,
    options: {
      auth: { scope: allowedScopes },
      description: 'select the region'
    }
  },
  postBillingBatchRegion: {
    method: 'POST',
    path: '/billing/batch/region',
    handler: controller.postBillingBatchRegion,
    options: {
      auth: { scope: allowedScopes },
      description: 'post handler for receiving the selected region'
    }
  },
  getBillingBatchExist: {
    method: 'GET',
    path: '/billing/batch/exist',
    handler: controller.getBillingBatchExist,
    options: {
      auth: { scope: allowedScopes },
      description: 'If a bill run exist, warn user and display short summary'
    }
  },
  getBillingBatchSummary: {
    method: 'GET',
    path: '/billing/batch/summary',
    handler: controller.getBillingBatchSummary,
    options: {
      auth: { scope: allowedScopes },
      description: 'displays the bill run summary'
    }
  }
};
