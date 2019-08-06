const controller = require('./controller');
const Joi = require('joi');

// TODO: Apply new scope to all of the following routes.
// Adding new internal users is restricted to the data_and_billing scope
module.exports = {
  getCreateAccount: {
    method: 'get',
    path: '/account/create-user',
    handler: controller.getCreateAccount,
    config: {
      // auth: { scope: 'data_and_billing' },
      plugins: {
        viewContext: {
          pageTitle: 'Create an internal account'
        }
      }
    }
  },

  postCreateAccount: {
    method: 'post',
    path: '/account/create-user',
    handler: controller.postCreateAccount,
    config: {
      // auth: { scope: 'data_and_billing' },
      plugins: {
        viewContext: {
          pageTitle: 'Create an internal account'
        }
      }
    }
  },

  getSetPermissions: {
    method: 'get',
    path: '/account/create-user/{userId}/set-permissions',
    handler: controller.getSetPermissions,
    config: {
      // auth: { scope: 'data_and_billing' },
      plugins: {
        viewContext: {
          pageTitle: 'Set permissions'
        }
      },
      validate: {
        params: {
          userId: Joi.number().integer().required()
        }
      }
    }
  },

  postSetPermissions: {
    method: 'post',
    path: '/account/create-user/{userId}/set-permissions',
    handler: controller.postSetPermissions,
    config: {
      // auth: { scope: 'data_and_billing' },
      plugins: {
        viewContext: {
          pageTitle: 'Set permissions'
        }
      },
      validate: {
        params: {
          userId: Joi.number().integer().required()
        }
      }
    }
  },

  getCreateUserSuccess: {
    method: 'get',
    path: '/account/create-user/{userId}/success',
    handler: controller.getCreateAccountSuccess,
    config: {
      // auth: { scope: 'data_and_billing' },
      plugins: {
        viewContext: {
          pageTitle: 'New account created'
        }
      },
      validate: {
        params: {
          userId: Joi.number().integer().required()
        }
      }
    }
  }
};
