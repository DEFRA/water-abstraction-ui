'use strict';
const Joi = require('@hapi/joi');
const controller = require('../controllers/two-part-tariff');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);
const preHandlers = require('../pre-handlers');

const { VALID_GUID } = require('shared/lib/validators');

const pre = [
  { method: preHandlers.loadBatch, assign: 'batch' },
  { method: preHandlers.checkBatchIsTwoPartTariffReview }
];

if (isAcceptanceTestTarget) {
  module.exports = {
    getBillingTwoPartTariffReview: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff-review',
      handler: controller.getTwoPartTariffReview,
      config: {
        pre,
        auth: { scope: allowedScopes },
        description: 'view list of 2PT returns data matching issues',
        plugins: {
          viewContext: {
            pageTitle: 'Review licences with returns data issues',
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID
          }
        }
      }
    },
    getBillingTwoPartTariffReady: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff-ready',
      handler: controller.getTwoPartTariffViewReady,
      config: {
        pre,
        auth: { scope: allowedScopes },
        description: 'view list of 2PT licences ready for billing',
        plugins: {
          viewContext: {
            pageTitle: 'View licences ready for billing',
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID
          }
        }
      }
    },
    getLicenceReview: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff-licence-review/{invoiceLicenceId}',
      handler: controller.getLicenceReview,
      config: {
        pre,
        auth: { scope: allowedScopes },
        description: 'review a single invoice licence within a 2PT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            invoiceLicenceId: VALID_GUID
          }
        }
      }
    },
    getQuantities: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff-licence-review/{invoiceLicenceId}/transaction/{transactionId}',
      handler: controller.getQuantities,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadInvoiceLicence, assign: 'invoiceLicence' }
        ],
        auth: { scope: allowedScopes },
        description: 'review transaction quantities in TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            invoiceLicenceId: VALID_GUID,
            transactionId: VALID_GUID
          }
        }
      }
    },

    postQuantities: {
      method: 'POST',
      path: '/billing/batch/{batchId}/two-part-tariff-licence-review/{invoiceLicenceId}/transaction/{transactionId}',
      handler: controller.postQuantities,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadInvoiceLicence, assign: 'invoiceLicence' }
        ],
        auth: { scope: allowedScopes },
        description: 'review transaction quantities in TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            invoiceLicenceId: VALID_GUID,
            transactionId: VALID_GUID
          }
        }
      }
    },

    getQuantitiesConfirm: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff-licence-review/{invoiceLicenceId}/transaction/{transactionId}/confirm',
      handler: controller.getQuantitiesConfirm,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadInvoiceLicence, assign: 'invoiceLicence' }
        ],
        auth: { scope: allowedScopes },
        description: 'review transaction quantities in TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            invoiceLicenceId: VALID_GUID,
            transactionId: VALID_GUID
          },
          query: {
            quantity: Joi.number().min(0).required()
          }
        }
      }
    }
  };
};
