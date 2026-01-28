const controller = require('./controller')
const Joi = require('joi')

const config = require('../../config.js')

const activeNavLink = config.featureToggles.enableUsersView ? 'users' : 'notifications'

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
          activeNavLink
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
          activeNavLink
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
          activeNavLink
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
          activeNavLink
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
          activeNavLink
        }
      },
      validate: {
        params: Joi.object().keys({
          userId: Joi.number().integer().required()
        })
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
          activeNavLink
        }
      },
      validate: {
        params: Joi.object().keys({
          userId: Joi.number().integer().required()
        })
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
          activeNavLink
        }
      },
      validate: {
        params: Joi.object().keys({
          userId: Joi.number().integer().required()
        })
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
          activeNavLink
        }
      },
      validate: {
        params: Joi.object().keys({
          userId: Joi.number().integer().required()
        })
      }
    }
  }
}
