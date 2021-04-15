'use strict';

const controller = require('../controllers/rebilling');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const { manageBillingAccounts } = require('internal/lib/constants').scope;
const allowedScopes = [manageBillingAccounts];

const { createRoutePair } = require('shared/lib/route-helpers');

module.exports = {
  ...createRoutePair(controller, 'rebillingStartDate', {
    path: '/billing-accounts/{billingAccountId}/rebilling',
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Get the start date for re-billing',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          billingAccountId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadBillingAccount, assign: 'billingAccount' },
        { method: preHandlers.getBillingAccountRebillableBills, assign: 'rebillableBills' }
      ]
    }
  }),

  ...createRoutePair(controller, 'checkAnswers', {
    path: '/billing-accounts/{billingAccountId}/rebilling/check-answers',
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Check answers for re-billing',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          billingAccountId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadBillingAccount, assign: 'billingAccount' },
        { method: preHandlers.getBillingAccountRebillableBills, assign: 'rebillableBills' }
      ]
    }
  })
};
