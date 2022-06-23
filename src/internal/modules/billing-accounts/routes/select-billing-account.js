'use strict'

const Joi = require('joi')
const { createRoutePair } = require('shared/lib/route-helpers')
const controller = require('../controllers/select-billing-account')
const preHandlers = require('../pre-handlers')

const { manageBillingAccounts } = require('internal/lib/constants').scope
const allowedScopes = [manageBillingAccounts]

module.exports = {

  ...createRoutePair(controller, 'selectExistingBillingAccount', {
    path: '/billing-account-entry/{key}',
    options: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: Joi.object().keys({
          key: Joi.string().required()
        })
      },
      pre: [{
        method: preHandlers.getAccount, assign: 'account'
      }, {
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.getBillingAccounts, assign: 'billingAccounts'
      }]
    }
  }),

  ...createRoutePair(controller, 'selectAccount', {
    path: '/billing-account-entry/{key}/select-account',
    options: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: Joi.object().keys({
          key: Joi.string().required()
        })
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.getAccount, assign: 'account'
      }]
    }
  }),

  getHandleAgentAccountEntry: {
    path: '/billing-account-entry/{key}/account-entry',
    method: 'get',
    handler: controller.getHandleAgentAccountEntry,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Handle agent account entry via account entry plugin',
      validate: {
        params: Joi.object().keys({
          key: Joi.string().required()
        })
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }]
    }
  },

  getHandleAddressEntry: {
    path: '/billing-account-entry/{key}/address-entry',
    method: 'get',
    handler: controller.getHandleAddressEntry,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Handle address entry via address entry plugin',
      validate: {
        params: Joi.object().keys({
          key: Joi.string().required()
        }),
        query: Joi.object().keys({
          checkAnswers: Joi.boolean().truthy('true').optional()
        })
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }]
    }
  },

  ...createRoutePair(controller, 'selectFAORequired', {
    path: '/billing-account-entry/{key}/fao',
    options: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: Joi.object().keys({
          key: Joi.string().required()
        }),
        query: Joi.object().keys({
          form: Joi.string().guid().optional()
        })
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.getAccount, assign: 'account'
      }]
    }
  }),

  getHandleContactEntry: {
    path: '/billing-account-entry/{key}/contact-entry',
    method: 'get',
    handler: controller.getHandleContactEntry,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Handle contact entry via contact entry plugin',
      validate: {
        params: Joi.object().keys({
          key: Joi.string().required()
        }),
        query: Joi.object().keys({
          checkAnswers: Joi.boolean().truthy('true').optional()
        })
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }]
    }
  },

  ...createRoutePair(controller, 'checkAnswers', {
    path: '/billing-account-entry/{key}/check-answers',
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Check answers page',
      validate: {
        params: Joi.object().keys({
          key: Joi.string().required()
        })
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.getBillingAccountLicences, assign: 'licences'
      }]
    }
  })

}
