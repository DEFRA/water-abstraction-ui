'use strict';

const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const { createRoutePair } = require('shared/lib/route-helpers');
const { billing } = require('internal/lib/constants').scope;
const Joi = require('joi');

const allowedScopes = [billing];

module.exports = {

  ...createRoutePair(controller, 'selectContact', {
    path: '/contact-entry/{key}/select-contact',
    options: {
      auth: { scope: allowedScopes },
      description: 'Select a contact',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      validate: {
        params: {
          key: Joi.string().required()
        }
      },
      pre: [
        { method: preHandlers.getSessionData, assign: 'sessionData' },
        { method: preHandlers.loadCompany, assign: 'company' },
        { method: preHandlers.loadCompanyContacts, assign: 'companyContacts' }
      ]
    }
  }),

  ...createRoutePair(controller, 'createContact', {
    path: '/contact-entry/{key}/create-contact',
    options: {
      auth: { scope: allowedScopes },
      description: 'Create a new contact',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      validate: {
        params: {
          key: Joi.string().required()
        }
      },
      pre: [
        { method: preHandlers.getSessionData, assign: 'sessionData' },
        { method: preHandlers.loadCompany, assign: 'company' }
      ]
    }
  })
};
