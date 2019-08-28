const Joi = require('@hapi/joi');
const controller = require('./controller');
const { scope } = require('../../lib/constants');

module.exports = {
  getManageLicences: {
    method: 'GET',
    path: '/manage_licences',
    handler: controller.getManageLicences,
    config: {
      auth: {
        scope: scope.licenceHolder
      },
      description: 'Manage licences - main page',
      plugins: {
        viewContext: {
          pageTitle: 'Add more of your licences or give others access',
          activeNavLink: 'manage'
        }
      }
    }
  },
  getAccessList: {
    method: 'GET',
    path: '/manage_licences/access',
    handler: controller.getAccessList,
    config: {
      auth: {
        scope: scope.licenceHolder
      },
      description: 'Manage licences - give/remove access',
      plugins: {
        viewContext: {
          pageTitle: 'Give access to your licences',
          activeNavLink: 'manage'
        }
      }
    }
  },
  getRemoveAccess: {
    method: 'GET',
    path: '/manage_licences/access/{colleagueEntityID}/remove',
    handler: controller.getRemoveAccess,
    config: {
      auth: {
        scope: scope.licenceHolder
      },
      description: 'Manage licences - remove access form',
      validate: {
        params: {
          colleagueEntityID: Joi.string().uuid().required()
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'manage',
          pageTitle: 'You are about to remove access'
        }
      }
    }
  },
  postRemoveAccess: {
    method: 'POST',
    path: '/manage_licences/access/remove',
    handler: controller.postRemoveAccess,
    config: {
      description: 'Remove all access for a  colleague',
      auth: {
        scope: scope.licenceHolder
      },
      plugins: {
        viewContext: {
          pageTitle: 'Access removed',
          activeNavLink: 'manage'
        }
      },
      validate: {
        payload: {
          colleagueEntityID: Joi.string().uuid().required(),
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  },

  getAddAccess: {
    method: 'GET',
    path: '/manage_licences/add_access',
    handler: controller.getAddAccess,
    config: {
      auth: {
        scope: scope.licenceHolder
      },
      description: 'Manage licences - add access form',
      plugins: {
        viewContext: {
          pageTitle: 'Give access to your licences',
          activeNavLink: 'manage'
        }
      }
    }
  },

  postAddAccess: {
    method: 'POST',
    path: '/manage_licences/add_access',
    handler: controller.postAddAccess,
    config: {
      auth: {
        scope: scope.licenceHolder
      },
      plugins: {
        viewContext: {
          pageTitle: 'Give access to your licences',
          activeNavLink: 'manage'
        }
      },
      description: 'Manage licences - add access process',
      validate: {
        payload: {
          email: Joi.string().max(254).allow(''),
          returns: Joi.boolean(),
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  },

  getChangeAccess: {
    method: 'GET',
    path: '/manage_licences/access/{colleagueEntityID}/change',
    handler: controller.getChangeAccess,
    config: {
      description: 'Change the licence access for a colleague',
      auth: {
        scope: scope.licenceHolder
      },
      validate: {
        params: {
          colleagueEntityID: Joi.string().uuid().required()
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'manage',
          pageTitle: 'Change access to your licences'
        }
      }
    }
  },
  postChangeAccess: {
    method: 'POST',
    path: '/manage_licences/access/change',
    handler: controller.postChangeAccess,
    config: {
      description: 'Updates the returns role for the user',
      auth: {
        scope: scope.licenceHolder
      },
      validate: {
        payload: {
          csrf_token: Joi.string().uuid().required(),
          colleagueEntityID: Joi.string().uuid().required(),
          returnsEntityRoleID: Joi.string().uuid().allow(''),
          returns: Joi.string()
        }
      }
    }
  }
};
