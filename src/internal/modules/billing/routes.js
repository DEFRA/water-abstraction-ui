const controller = require('./controller');
const { billing } = require('internal/lib/constants').scope;
const Joi = require('@hapi/joi');

const allowedScopes = [billing];

const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);

if (isAcceptanceTestTarget) {
  module.exports = {
    getBillingBatchType: {
      method: 'GET',
      path: '/billing/batch/type',
      handler: controller.getBillingBatchType,
      config: {
        auth: { scope: allowedScopes },
        description: 'select bill run type',
        plugins: {
          viewContext: {
            pageTitle: 'Which kind of bill run do you want to create?',
            activeNavLink: 'notifications'
          }
        }
      }
    },
    postBillingBatchType: {
      method: 'POST',
      path: '/billing/batch/type',
      handler: controller.postBillingBatchType,
      config: {
        auth: { scope: allowedScopes },
        description: 'post handler for select type'
      }
    },

    getBillingBatchRegion: {
      method: 'GET',
      path: '/billing/batch/region/{billingType}',
      handler: controller.getBillingBatchRegion,
      config: {
        auth: { scope: allowedScopes },
        description: 'select bill run region',
        plugins: {
          viewContext: {
            pageTitle: 'Select the region',
            activeNavLink: 'notifications'
          }
        }
      }
    },
    postBillingBatchRegion: {
      method: 'POST',
      path: '/billing/batch/region',
      handler: controller.postBillingBatchRegion,
      config: {
        auth: { scope: allowedScopes },
        description: 'post handler for receiving the selected region'
      }
    },
    getBillingBatchExist: {
      method: 'GET',
      path: '/billing/batch/exist',
      handler: controller.getBillingBatchExist,
      config: {
        auth: { scope: allowedScopes },
        description: 'If a bill run exist, warn user and display short summary',
        plugins: {
          viewContext: {
            pageTitle: 'Bill run exist',
            activeNavLink: 'notifications'
          }
        }
      }
    },
    getBillingBatchSummary: {
      method: 'GET',
      path: '/billing/batch/summary/{batchEventId}',
      handler: controller.getBillingBatchSummary,
      config: {
        auth: { scope: allowedScopes },
        description: 'displays the bill run summary',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        }
      }
    },
    getBillingBillRunList: {
      method: 'GET',
      path: '/billing/batch/list',
      handler: controller.getBillingBillRunList,
      config: {
        auth: { scope: allowedScopes },
        description: 'displays a list of past bill runs',
        plugins: {
          viewContext: {
            pageTitle: 'Bill runs',
            activeNavLink: 'notifications'
          }
        },
        validate: {
          query: {
            page: Joi.number().optional().default(1)
          }
        }
      }
    }
  };
};
