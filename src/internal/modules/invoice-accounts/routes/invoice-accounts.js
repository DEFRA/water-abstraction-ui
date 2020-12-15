'use strict';

const Joi = require('joi');
const controller = require('../controllers/invoice-accounts');
const { charging } = require('internal/lib/constants').scope;
const { VALID_GUID } = require('shared/lib/validators');
const preHandlers = require('../pre-handlers');
const allowedScopes = [charging];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'qa', 'preprod'].includes(process.env.NODE_ENV);

if (isAcceptanceTestTarget) {
  module.exports = {
    getCompany: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}',
      handler: controller.getCompany,
      config: {
        auth: { scope: allowedScopes },
        description: 'select invoice account company contact',
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
            form: Joi.string().optional(),
            redirectPath: Joi.string().required(),
            licenceId: Joi.string().uuid().optional()
          }
        },
        pre: [
          { method: preHandlers.loadCompanies, assign: 'companies' }
        ]
      }
    },
    postCompany: {
      method: 'POST',
      path: '/invoice-accounts/create/{regionId}/{companyId}',
      handler: controller.postCompany,
      config: {
        auth: { scope: allowedScopes },
        description: 'select invoice account company contact',
        validate: {
          params: {
            regionId: VALID_GUID,
            companyId: VALID_GUID
          },
          payload: {
            csrf_token: VALID_GUID,
            companySearch: Joi.string().optional().allow(''),
            selectedCompany: Joi.string().optional().allow('')
          }
        },
        pre: [
          { method: preHandlers.loadCompanies, assign: 'companies' }
        ]
      }
    },

    getAddress: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/select-address',
      handler: controller.getAddress,
      config: {
        auth: { scope: allowedScopes },
        description: 'select invoice account address',
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

    getContactEntryTakeover: { // This route is intended to act as a redirection utility. When users reach the end of the `contact-entry` workflow, they will be redirected to this GET request.
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/contact-entry-complete',
      handler: controller.getContactEntryHandover,
      config: {
        auth: { scope: allowedScopes },
        description: 'Redirects the user into the invoice-account flow after a new contact has been created',
        validate: {
          params: {
            regionId: VALID_GUID,
            companyId: VALID_GUID
          },
          query: { sessionKey: VALID_GUID }
        }
      }

    },

    /*
    getCreateAddress: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/create-address',
      handler: controller.getCreateAddress,
      config: {
        auth: { scope: allowedScopes },
        description: 'Enter invoice account address',
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
          query: { form: Joi.string().optional() }
        }
      }
    },
    */

    getAddressEntered: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/address-entered',
      handler: controller.getAddressEntered,
      config: {
        auth: { scope: allowedScopes },
        description: 'Redirect path from the address entry module',
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
          query: { form: Joi.string().optional() }
        }
      }
    },

    getFao: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/add-fao',
      handler: controller.getFao,
      config: {
        auth: { scope: allowedScopes },
        description: 'select invoice account FAO',
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
    postFao: {
      method: 'POST',
      path: '/invoice-accounts/create/{regionId}/{companyId}/add-fao',
      handler: controller.postFao,
      config: {
        auth: { scope: allowedScopes },
        description: 'select invoice account FAO',
        validate: {
          params: {
            regionId: VALID_GUID,
            companyId: VALID_GUID
          },
          payload: {
            csrf_token: VALID_GUID,
            faoRequired: Joi.string().optional().allow('')
          }
        }
      }
    },
    getCheckDetails: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/check-details',
      handler: controller.getCheckDetails,
      config: {
        auth: { scope: allowedScopes },
        description: 'check and confirm invoice account details',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            regionId: VALID_GUID,
            companyId: VALID_GUID
          }
        },
        pre: [
          { method: preHandlers.loadCompanies, assign: 'companies' }
        ]
      }
    },
    postCheckDetails: {
      method: 'POST',
      path: '/invoice-accounts/create/{regionId}/{companyId}/check-details',
      handler: controller.postCheckDetails,
      config: {
        auth: { scope: allowedScopes },
        description: 'save invoice account details',
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
          payload: {
            csrf_token: Joi.string().uuid().required()
          }
        }
      }
    },
    getSearchCompany: {
      method: 'GET',
      path: '/invoice-accounts/create/{regionId}/{companyId}/contact-search',
      handler: controller.getSearchCompany,
      config: {
        auth: { scope: allowedScopes },
        description: 'find an existing contact to associate with the invoice account',
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
            filter: Joi.string().required(),
            form: Joi.string().optional()
          }
        },
        pre: [{ method: preHandlers.searchForCompaniesByString, assign: 'contactSearchResults' }]
      }
    },
    postSearchCompany: {
      method: 'POST',
      path: '/invoice-accounts/create/{regionId}/{companyId}/contact-search',
      handler: controller.postSearchCompany,
      options: {
        pre: [{ method: preHandlers.searchForCompaniesByString, assign: 'contactSearchResults' }]
      }
    }
  };
};
