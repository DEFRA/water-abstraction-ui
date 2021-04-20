'use strict';

const controller = require('../controllers/rebilling');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const { manageBillingAccounts } = require('internal/lib/constants').scope;
const allowedScopes = [manageBillingAccounts];

const { createRoutePair } = require('shared/lib/route-helpers');

const getOptions = description => ({
  description,
  auth: {
    scope: allowedScopes
  },
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
    { method: preHandlers.getRebillingState, assign: 'rebillingState' },
    { method: preHandlers.loadBillingAccount, assign: 'billingAccount' },
    { method: preHandlers.getBillingAccountRebillableBills, assign: 'rebillableBills' }
  ]
});

module.exports = {
  ...createRoutePair(controller, 'rebillingStartDate', {
    path: '/billing-accounts/{billingAccountId}/rebilling',
    options: getOptions('Get the start date for re-billing')
  }),

  ...createRoutePair(controller, 'checkAnswers', {
    path: '/billing-accounts/{billingAccountId}/rebilling/check-answers',
    options: getOptions('Check answers for re-billing')
  }),

  ...createRoutePair(controller, 'selectBills', {
    path: '/billing-accounts/{billingAccountId}/rebilling/select-bills',
    options: getOptions('Select bills for re-billing')
  })
};
