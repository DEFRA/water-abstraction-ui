'use strict';

const { kebabCase } = require('lodash');
const Joi = require('joi');
const controller = require('../controllers/create-bill-run');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const preHandlers = require('../pre-handlers');
const billRunTypes = require('../lib/bill-run-types');
const seasons = require('../lib/seasons');

const VALID_BILL_RUN_TYPES = Joi.string().required().valid(
  ...Object.values(billRunTypes).map(kebabCase)
);

const VALID_SEASONS = Joi.string().valid(
  ...Object.values(seasons).map(kebabCase)
);

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
          activeNavLink: 'bill-runs'
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
        params: Joi.object().keys({
          billingType: VALID_BILL_RUN_TYPES,
          season: VALID_SEASONS
        })
      },

      plugins: {
        viewContext: {
          pageTitle: 'Select the region',
          activeNavLink: 'bill-runs'
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
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        })
      }
    }
  },

  getBillingBatchDuplicate: {
    method: 'GET',
    path: '/billing/batch/{batchId}/duplicate',
    handler: controller.getBillingBatchDuplicate,
    config: {
      pre: [{ method: preHandlers.loadBatch, assign: 'batch' }],
      auth: { scope: allowedScopes },
      description: 'If a bill run has already been run for region, year and season, warn user and display short summary',
      plugins: {
        viewContext: {
          pageTitle: 'This bill run has already been run',
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        })
      }
    }
  },

  getBillingBatchFinancialYear: {
    method: 'GET',
    path: '/billing/batch/financial-year/{billingType}/{season}/{region}',
    handler: controller.getBillingBatchFinancialYear,
    config: {
      pre: [],
      auth: { scope: allowedScopes },
      description: 'If a bill run has already been run for region, year and season, warn user and display short summary',
      plugins: {
        viewContext: {
          pageTitle: 'Select the finacial year',
          activeNavLink: ''
        }
      }
    }
  },

  postBillingFinancialYear: {
    method: 'POST',
    path: '/billing/batch/financial-year',
    handler: controller.postBillingBatchFinancialYear,
    config: {
      auth: { scope: allowedScopes },
      description: 'post handler for receiving the selected financial year'
    }
  }
};
