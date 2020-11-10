'use strict';

const Joi = require('joi');
const controller = require('../controllers/bill-run');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);
const preHandlers = require('../pre-handlers');

const { featureToggles } = require('../../../config');

if (isAcceptanceTestTarget) {
  const routes = {

    getBillingBatchSummary: {
      method: 'GET',
      path: '/billing/batch/{batchId}/summary',
      handler: controller.getBillingBatchSummary,
      config: {
        app: {
          validBatchStatuses: ['ready', 'sent']
        },
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
          { method: preHandlers.loadBatch, assign: 'batch' },
          { method: preHandlers.redirectOnBatchStatus }
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
    getBillingBatchDeleteInvoice: {
      method: 'GET',
      path: '/billing/batch/{batchId}/delete-invoice/{invoiceId}',
      handler: controller.getBillingBatchDeleteInvoice,
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
        pre: [
          { method: preHandlers.loadBatch, assign: 'batch' },
          { method: preHandlers.loadInvoice, assign: 'invoice' },
          preHandlers.checkBatchStatusIsReady
        ]
      }
    },
    postBillingBatchDeleteInvoice: {
      method: 'POST',
      path: '/billing/batch/{batchId}/delete-invoice/{invoiceId}',
      handler: controller.postBillingBatchDeleteInvoice,
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
            invoiceId: Joi.string().uuid()
          },
          payload: {
            csrf_token: Joi.string().uuid().required()
          }
        }
      }
    },

    getBillingBatchProcessing: {
      method: 'GET',
      path: '/billing/batch/{batchId}/processing',
      handler: controller.getBillingBatchProcessing,
      config: {
        app: {
          validBatchStatuses: ['processing', 'error']
        },
        auth: { scope: allowedScopes },
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
          { method: preHandlers.loadBatch, assign: 'batch' },
          { method: preHandlers.redirectOnBatchStatus }
        ]
      }
    },

    getBillingBatchEmpty: {
      method: 'GET',
      path: '/billing/batch/{batchId}/empty',
      handler: controller.getBillingBatchEmpty,
      config: {
        app: {
          validBatchStatuses: ['empty']
        },
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
        pre: [
          { method: preHandlers.loadBatch, assign: 'batch' },
          { method: preHandlers.redirectOnBatchStatus }
        ]
      }
    }
  };

  if (featureToggles.deleteAllBillingData) {
    routes.postDeleteAllBillingData = {
      method: 'POST',
      path: '/billing/batch/delete-all-data',
      handler: controller.postDeleteAllBillingData,
      config: {
        auth: { scope: allowedScopes }
      }
    };
  }

  module.exports = routes;
};
