// Two part tariff billing routes to go here

// const Joi = require('joi');
const controller = require('../controllers/two-part-tariff');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);

// const preHandlers = require('../pre-handlers');
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
        }
      }
    }
  };
};
