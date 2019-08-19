const Joi = require('@hapi/joi');
const controller = require('./controller');

module.exports = {
  getSearchForm: {
    path: '/licences',
    method: 'GET',
    handler: controller.getSearchForm,
    options: {
      description: 'Internal search',
      plugins: {
        viewContext: {
          pageTitle: 'Search licences, users and returns',
          activeNavLink: 'view'
        }
      },
      validate: {
        query: {
          query: Joi.string().allow(''),
          page: Joi.number().default(1).min(1)
        }
      }
    }
  },

  getUserStatus: {
    method: 'GET',
    path: '/user/{userId}/status',
    handler: controller.getUserStatus,
    config: {
      description: 'Admin: view the licence, verification and login status of a user',
      plugins: {
        viewContext: {
          pageTitle: 'User status',
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          userId: Joi.number()
        }
      }
    }
  },

  postUpdatePermissions: {
    method: 'POST',
    path: '/user/{userId}/update-permissions',
    handler: controller.postUpdatePermissions,
    config: {
      description: 'Admin: view the licence, verification and login status of a user',
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'User status',
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          userId: Joi.number()
        }
      }
    }
  },

  getUpdateSuccessful: {
    method: 'GET',
    path: '/user/{userId}/update-permissions/success',
    handler: controller.getUpdateSuccessful,
    config: {
      description: 'Admin: internal user permissions updated successfully',
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Account permissions are updated',
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          userId: Joi.number()
        }
      }
    }
  }
};
