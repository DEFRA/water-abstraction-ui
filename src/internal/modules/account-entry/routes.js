'use strict';

const preHandlers = require('./pre-handlers');
const Joi = require('joi');
const controller = require('./controller');
const { createRoutePair } = require('shared/lib/route-helpers');

const { manageBillingAccounts } = require('internal/lib/constants').scope;
const allowedScopes = [manageBillingAccounts];

module.exports = {

  ...createRoutePair(controller, 'selectExistingAccount', {
    path: '/account-entry/{key}/select-existing-account',
    options: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        query: Joi.object().keys({
          q: Joi.string().required(),
          form: Joi.string().guid().optional()
        }),
        params: Joi.object().keys({
          key: Joi.string().required()
        })
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.searchCRMCompanies, assign: 'companies'
      }]
    }
  }),

  ...createRoutePair(controller, 'selectAccountType', {
    path: '/account-entry/{key}/select-account-type',
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
      }]
    }
  }),

  ...createRoutePair(controller, 'companySearch', {
    path: '/account-entry/{key}/company-search',
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
        method: preHandlers.searchForCompaniesInCompaniesHouse, assign: 'companiesHouseResults'
      }]
    }
  })

};
