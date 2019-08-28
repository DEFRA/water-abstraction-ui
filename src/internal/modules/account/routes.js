const controller = require('./controller');
const Joi = require('joi');

module.exports = {
  getCreateAccount: {
    method: 'get',
    path: '/account/create-user',
    handler: controller.getCreateAccount,
    config: {
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Create an internal account',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  postCreateAccount: {
    method: 'post',
    path: '/account/create-user',
    handler: controller.postCreateAccount,
    config: {
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Create an internal account',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  getSetPermissions: {
    method: 'get',
    path: '/account/create-user/set-permissions',
    handler: controller.getSetPermissions,
    config: {
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Set permissions',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  postSetPermissions: {
    method: 'post',
    path: '/account/create-user/set-permissions',
    handler: controller.postSetPermissions,
    config: {
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Set permissions',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  getCreateUserSuccess: {
    method: 'get',
    path: '/account/create-user/{userId}/success',
    handler: controller.getCreateAccountSuccess,
    config: {
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'New account created',
          activeNavLink: 'notifications'
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
