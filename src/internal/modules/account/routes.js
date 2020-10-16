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

  getManageAccounts: {
    method: 'get',
    path: '/accounts',
    handler: controller.getManageAccounts,
    config: {
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'View internal accounts',
          activeNavLink: 'notifications'
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
  },

  getReinstateUserAccount: {
    method: 'GET',
    path: '/account/reinstate-account/{userId}',
    handler: controller.getReinstateUserAccount,
    config: {
      description: 'Admin: reinstate internal user account',
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Reinstate user account',
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

  postReinstateUserAccount: {
    method: 'POST',
    path: '/account/reinstate-account/{userId}',
    handler: controller.postReinstateUserAccount,
    config: {
      description: 'Admin: reinstate internal user account',
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Reinstate user account',
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

  getReinstateAccountSuccess: {
    method: 'GET',
    path: '/account/reinstate-account/{userId}/success',
    handler: controller.getReinstateAccountSuccess,
    config: {
      description: 'Admin: internal user account reinstated successfully',
      auth: { scope: 'manage_accounts' },
      plugins: {
        viewContext: {
          pageTitle: 'Account reinstated',
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
