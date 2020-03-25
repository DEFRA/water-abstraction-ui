'use strict';

const Joi = require('joi');
const controller = require('../controllers/bill-run');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);
const preHandlers = require('../pre-handlers');
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

    getBillingBatchExists: {
      method: 'GET',
      path: '/billing/batch/{batchId}/exists',
      handler: controller.getBillingBatchExists,
      config: {
        pre: [{ method: preHandlers.loadBatch, assign: 'batch' }],
        auth: { scope: allowedScopes },
        description: 'If a bill run exist, warn user and display short summary',
        plugins: {
          viewContext: {
            pageTitle: 'A bill run already exists',
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: Joi.string().uuid()
          }
        }
      }
    },

    getBillingBatchSummary: {
      method: 'GET',
      path: '/billing/batch/{batchId}/summary',
      handler: controller.getBillingBatchSummary,
      config: {
        auth: { scope: allowedScopes },
        description: 'displays the bill run summary',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: Joi.string().uuid()
          },
          query: {
            back: Joi.number().integer().default(1).optional()
          }
        },
        pre: [
          preHandlers.redirectToWaitingIfEventNotComplete
        ]
      }
    },

    getBillingBatchInvoice: {
      method: 'GET',
      path: '/billing/batch/{batchId}/invoice/{invoiceId}',
      handler: controller.getBillingBatchInvoice,
      config: {
        auth: { scope: allowedScopes },
        description: 'displays the invoice for a specific bill run',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: Joi.string().uuid(),
            invoiceId: Joi.string().uuid()
          }
        }
      }
    },

    getBillingBatchList: {
      method: 'GET',
      path: '/billing/batch/list',
      handler: controller.getBillingBatchList,
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
            page: Joi.number().integer().min(1).default(1)
          }
        }
      }
    },

    getBillingBatchConfirm: {
      method: 'GET',
      path: '/billing/batch/{batchId}/confirm',
      handler: controller.getBillingBatchConfirm,
      config: {
        auth: { scope: allowedScopes },
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: Joi.string().uuid()
          }
        },
        pre: [{ method: preHandlers.loadBatch, assign: 'batch' }]
      }
    },

    postBillingBatchConfirm: {
      method: 'POST',
      path: '/billing/batch/{batchId}/confirm',
      handler: controller.postBillingBatchConfirm,
      config: {
        auth: { scope: allowedScopes },
        validate: {
          params: {
            batchId: Joi.string().uuid().required()
          },
          payload: {
            csrf_token: Joi.string().uuid().required()
          }
        }
      }
    },

    getBillingBatchCancel: {
      method: 'GET',
      path: '/billing/batch/{batchId}/cancel',
      handler: controller.getBillingBatchCancel,
      config: {
        auth: { scope: allowedScopes },
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: Joi.string().uuid()
          }
        },
        pre: [{ method: preHandlers.loadBatch, assign: 'batch' }]
      }
    },

    postBillingBatchCancel: {
      method: 'POST',
      path: '/billing/batch/{batchId}/cancel',
      handler: controller.postBillingBatchCancel,
      config: {
        auth: { scope: allowedScopes },
        validate: {
          params: {
            batchId: Joi.string().uuid().required()
          },
          payload: {
            csrf_token: Joi.string().uuid().required()
          }
        }
      }
    },

    getTransactionsCSV: {
      method: 'GET',
      path: '/billing/batch/{batchId}/transactions-csv',
      handler: controller.getTransactionsCSV,
      config: {
        auth: { scope: allowedScopes },
        validate: {
          params: {
            batchId: Joi.string().uuid().required()
          }
        },
        pre: [{ method: preHandlers.loadBatch, assign: 'batch' }]
      }
    },
    getBillingBatchDeleteAccount: {
      method: 'GET',
      path: '/billing/batch/{batchId}/delete-account/{invoiceId}',
      handler: controller.getBillingBatchDeleteAccount,
      config: {
        auth: { scope: allowedScopes },
        description: 'Request confirmation to remove invoice from bill run',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: Joi.string().uuid(),
            invoiceId: Joi.string().uuid()
          }
        },
        pre: [{ method: preHandlers.loadBatch, assign: 'batch' }]
      }
    },
    postBillingBatchDeleteAccount: {
      method: 'POST',
      path: '/billing/batch/{batchId}/delete-account/{accountId}',
      handler: controller.postBillingBatchDeleteAccount,
      config: {
        auth: { scope: allowedScopes },
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: Joi.string().uuid(),
            accountId: Joi.string().uuid()
          },
          payload: {
            csrf_token: Joi.string().uuid().required()
          }
        }
      }
    }
  };
};
