'use strict';

const preHandlers = require('./pre-handlers');
const Joi = require('@hapi/joi');
const controller = require('./controller');
const { createRoutePair } = require('shared/lib/route-helpers');

module.exports = {

  ...createRoutePair(controller, 'selectExistingAccount', {
    path: '/account-entry/{key}/select-existing-account',
    options: {
      validate: {
        query: {
          q: Joi.string().required(),
          form: Joi.string().guid().optional()
        },
        params: {
          key: Joi.string().required()
        }
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
      validate: {
        params: {
          key: Joi.string().required()
        }
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }]
    }
  }),

  ...createRoutePair(controller, 'companySearch', {
    path: '/account-entry/{key}/company-search',
    options: {
      validate: {
        params: {
          key: Joi.string().required()
        }
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.searchForCompaniesInCompaniesHouse, assign: 'companiesHouseResults'
      }]
    }
  })

};
