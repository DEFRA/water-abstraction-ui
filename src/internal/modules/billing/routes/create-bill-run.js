'use strict';

const { kebabCase } = require('lodash');
const Joi = require('joi');
const controller = require('../controllers/create-bill-run');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);
const preHandlers = require('../pre-handlers');
const billRunTypes = require('../lib/bill-run-types');
const { seasons } = require('../lib/constants');

const VALID_BILL_RUN_TYPES = Joi.string().required().valid(
  Object.values(billRunTypes).map(kebabCase)
);
const VALID_SEASONS = Joi.string().valid(
  Object.values(seasons).map(kebabCase)
);

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
      path: '/billing/batch/region/{billingType}/{season?}',
      handler: controller.getBillingBatchRegion,
      config: {
        auth: { scope: allowedScopes },
        description: 'select bill run region',
        validate: {
          params: {
            billingType: VALID_BILL_RUN_TYPES,
            season: VALID_SEASONS
          }
        },

        plugins: {
          viewContext: {
            pageTitle: 'Select the region',
            activeNavLink: 'notifications'
          }
        },
        pre: [
          { method: preHandlers.loadRegions, assign: 'regions' }
        ]
      }
    },

    postBillingBatchRegion: {
      method: 'POST',
      path: '/billing/batch/region',
      handler: controller.postBillingBatchRegion,
      config: {
        auth: { scope: allowedScopes },
        description: 'post handler for receiving the selected region',
        pre: [
          { method: preHandlers.loadRegions, assign: 'regions' }
        ]
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
    }

  };
};
