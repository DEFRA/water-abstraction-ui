'use strict'

const controller = require('../controllers/billing-accounts')
const preHandlers = require('../pre-handlers')
const Joi = require('joi')
const { VALID_GUID } = require('shared/lib/validators')
const { manageBillingAccounts } = require('internal/lib/constants').scope
const allowedScopes = [manageBillingAccounts]

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
        params: Joi.object().keys({
          billingAccountId: VALID_GUID
        }),
        query: Joi.object().keys({
          back: Joi.string().optional()
        })
      },
      pre: [
        { method: preHandlers.loadBillingAccount, assign: 'billingAccount' },
        { method: preHandlers.getBillingAccountBills, assign: 'bills' },
        { method: preHandlers.getBillingAccountRebillableBills, assign: 'rebillableBills' }
      ]
    }
  },

  getBillingAccountBills: {
    method: 'GET',
    path: '/billing-accounts/{billingAccountId}/bills',
    handler: controller.getBillingAccountBills,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'View all bills for a billing account',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          billingAccountId: VALID_GUID
        }),
        query: Joi.object().keys({
          page: Joi.number().min(1),
          perPage: Joi.number().min(1).default(50)
        })
      },
      pre: [
        { method: preHandlers.loadBillingAccount, assign: 'billingAccount' },
        { method: preHandlers.getBillingAccountBills, assign: 'bills' }
      ]
    }
  }
}
