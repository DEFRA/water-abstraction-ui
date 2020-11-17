const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const Joi = require('@hapi/joi');
const { VALID_GUID } = require('shared/lib/validators');
const { billing } = require('internal/lib/constants').scope;
const allowedScopes = [billing];

module.exports = {
  getBillingAccount: {
    method: 'GET',
    path: '/billing-accounts/{billingAccountId}',
    handler: controller.getBillingAccount,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'View billing account for given id',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          billingAccountId: VALID_GUID
        },
        query: {
          back: Joi.string().optional()
        }
      },
      pre: [
        { method: preHandlers.loadBillingAccount, assign: 'billingAccount' }
      ]
    }
  }
};
