'use strict';

const Joi = require('joi');
const controller = require('../controllers/two-part-tariff');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);

if (isAcceptanceTestTarget) {
  module.exports = {
    getBillingTwoPartTariffReview: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff-summary',
      handler: controller.getTwoPartTariffReview,
      config: {
        auth: { scope: allowedScopes },
        description: 'view list of 2PT matching issues',
        plugins: {
          viewContext: {
            pageTitle: 'Review licences with returns data issues',
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
