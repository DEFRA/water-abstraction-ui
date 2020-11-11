const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const Joi = require('@hapi/joi');

const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

module.exports = {
  getPostcode: {
    method: 'GET',
    path: '/address-entry/postcode',
    handler: controller.getPostcode,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Enter UK postcode',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      validate: {
        query: {
          licenceId: Joi.string().guid().optional().allow(null),
          back: Joi.string().required(),
          redirectPath: Joi.string().required(),
          form: Joi.string().optional()
        }
      }
    }
  },

  postPostcode: {
    method: 'POST',
    path: '/address-entry/postcode',
    handler: controller.postPostcode,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Enter UK postcode',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      }
    }
  },

  getSelectAddress: {
    method: 'GET',
    path: '/address-entry/address/select',
    handler: controller.getSelectAddress,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select address from address options',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      validate: {
        query: {
          postcode: Joi.string().required().allow(''),
          form: Joi.string().optional()
        }
      },
      pre: [
        { method: preHandlers.searchForAddressesByPostcode, assign: 'addressSearchResults' }
      ]
    }
  },

  postSelectAddress: {
    method: 'POST',
    path: '/address-entry/address/select',
    handler: controller.postSelectAddress,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select address from address options',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      pre: [
        { method: preHandlers.searchForAddressesByPostcode, assign: 'addressSearchResults' }
      ]
    }
  },

  getManualAddressEntry: {
    method: 'GET',
    path: '/address-entry/manual-entry',
    handler: controller.getManualAddressEntry,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Enter address manually',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      }
    }
  },

  postManualAddressEntry: {
    method: 'POST',
    path: '/address-entry/manual-entry',
    handler: controller.postManualAddressEntry,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Enter address manually',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      }
    }
  }
};
