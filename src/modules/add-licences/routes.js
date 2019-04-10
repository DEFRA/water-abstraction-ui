const Joi = require('joi');
const controller = require('./controller');

module.exports = {

  // Add licence to account
  getLicenceAdd: {
    method: 'GET',
    path: '/add-licences',
    handler: controller.getLicenceAdd,
    config: {
      description: 'Start flow to add licences'
    }
  },
  postLicenceAdd: {
    method: 'POST',
    path: '/add-licences',
    handler: controller.postLicenceAdd,
    config: {
      description: 'Start flow to add licences',
      validate: {
        payload: {
          licence_no: Joi.string().allow('').max(9000),
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  },

  // Select licences
  getLicenceSelect: {
    method: 'GET',
    path: '/select-licences',
    handler: controller.getLicenceSelect,
    config: {
      description: 'Select the licences to add',
      validate: {
        query: {
          error: Joi.string().max(32)
        }
      }
    }
  },
  postLicenceSelect: {
    method: 'POST',
    path: '/select-licences',
    handler: controller.postLicenceSelect,
    config: {
      description: 'Post handler for licence select',
      validate: {
        payload: {
          licences: [Joi.array(), Joi.string().allow('')],
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  },
  getLicenceSelectError: {
    method: 'GET',
    path: '/select-licences-error',
    handler: controller.getLicenceSelectError,
    config: {
      description: 'Error uploading licences - show contact information'
    }
  },

  getAddressSelect: {
    method: 'GET',
    path: '/select-address',
    handler: controller.getAddressSelect,
    config: {
      description: 'Select the address to send postal verification letter',
      validate: {
        query: {
          error: Joi.string().allow('').max(32)
        }
      }
    }
  },

  postAddressSelect: {
    method: 'POST',
    path: '/select-address',
    handler: controller.postAddressSelect,
    config: {
      description: 'Post handler for select address form',
      validate: {
        payload: {
          address: Joi.string().allow('').guid(),
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  },

  getForAttentionOf: {
    method: 'GET',
    path: '/add-addressee',
    handler: controller.getFAO,
    config: {
      description: 'Specify a name or department for security code letter',
      plugins: {
        viewContext: {
          activeNavLink: 'manage'
        }
      }
    }
  },
  postForAttentionOf: {
    method: 'POST',
    path: '/add-addressee',
    handler: controller.postFAO,
    config: {
      description: 'Specify a name or department for security code letter',
      plugins: {
        viewContext: {
          activeNavLink: 'manage'
        }
      }
    }
  },

  getSecurityCode: {
    method: 'GET',
    path: '/security-code',
    handler: controller.getSecurityCode,
    config: {
      description: 'Enter auth code received by post',
      plugins: {
        licenceLoader: {
          loadUserLicenceCount: true
        }
      }
    }
  },
  postSecurityCode: {
    method: 'POST',
    path: '/security-code',
    handler: controller.postSecurityCode,
    config: {
      description: 'Enter auth code received by post',
      plugins: {
        licenceLoader: {
          loadUserLicenceCount: true
        }
      },
      validate: {
        payload: {
          verification_code: Joi.string().allow('').max(5),
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  }

};
