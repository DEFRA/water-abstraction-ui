'use strict';

const Joi = require('joi');
const controller = require('../controllers/contacts');
const { charging } = require('internal/lib/constants').scope;
const { VALID_GUID } = require('shared/lib/validators');

const allowedScopes = [charging];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);

if (isAcceptanceTestTarget) {
  module.exports = {
    getContactSelect: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/select-contact',
      handler: controller.getContactSelect,
      config: {
        auth: { scope: allowedScopes },
        description: 'select invoice account contact',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            regionId: VALID_GUID,
            companyId: VALID_GUID
          },
          query: {
            form: Joi.string().optional()
          }
        }
      }
    },
    postContactSelect: {
      method: 'POST',
      path: '/invoice-accounts/create/{regionId}/{companyId}/select-contact',
      handler: controller.postContactSelect,
      config: {
        auth: { scope: allowedScopes },
        description: 'select invoice account contact',
        validate: {
          params: {
            regionId: VALID_GUID,
            companyId: VALID_GUID
          },
          payload: {
            csrf_token: VALID_GUID,
            selectedContact: Joi.string().optional().allow(''),
            department: Joi.string().optional().allow('')
          }
        }
      }
    },
    getContactCreate: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/create-contact',
      handler: controller.getContactCreate,
      config: {
        auth: { scope: allowedScopes },
        description: 'create new invoice account contact',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            regionId: VALID_GUID,
            companyId: VALID_GUID
          },
          query: {
            form: Joi.string().optional()
          }
        }
      }
    },
    postContactCreate: {
      method: 'POST',
      path: '/invoice-accounts/create/{regionId}/{companyId}/create-contact',
      handler: controller.postContactCreate,
      config: {
        auth: { scope: allowedScopes },
        description: 'create new invoice account contact',
        validate: {
          params: {
            regionId: VALID_GUID,
            companyId: VALID_GUID
          },
          payload: {
            csrf_token: VALID_GUID,
            title: Joi.string().trim().optional().allow(''),
            firstName: Joi.string().trim().optional().allow(''),
            middleInitials: Joi.string().trim().optional().allow(''),
            lastName: Joi.string().trim().optional().allow(''),
            suffix: Joi.string().trim().optional().allow(''),
            department: Joi.string().trim().optional().allow('')
          }
        }
      }
    }
  };
};
