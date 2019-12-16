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
  },

  getDeleteUserAccount: {
    method: 'GET',
    path: '/account/delete-account/{userId}',
    handler: controller.getDeleteUserAccount,
    config: {
      description: 'Admin: delete internal user account',
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Delete user account',
          activeNavLink: 'notifications'
        }
      },
      validate: {
        params: {
          userId: Joi.number().integer().required()
        }
      }
    }
  },

  postDeleteUserAccount: {
    method: 'POST',
    path: '/account/delete-account/{userId}',
    handler: controller.postDeleteUserAccount,
    config: {
      description: 'Admin: delete internal user account',
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Delete user account',
          activeNavLink: 'notifications'
        }
      },
      validate: {
        params: {
          userId: Joi.number().integer().required()
        }
      }
    }
  },

  getDeleteAccountSuccess: {
    method: 'GET',
    path: '/account/delete-account/{userId}/success',
    handler: controller.getDeleteAccountSuccess,
    config: {
      description: 'Admin: internal user account deleted successfully',
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Account deleted',
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
