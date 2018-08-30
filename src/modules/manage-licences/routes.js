const Joi = require('joi');
const controller = require('./controller');

module.exports = {
  // Manage licences
  getManageLicences: {
    method: 'GET',
    path: '/manage_licences',
    handler: controller.getManage,
    config: {
      description: 'Manage licences - main page',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        },
        viewContext: {
          pageTitle: 'Manage your licences',
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
      description: 'Manage licences - give/remove access',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      }
    }
  },
  getRemoveAccess: {
    method: 'GET',
    path: '/manage_licences/access/{colleagueEntityID}/remove',
    handler: controller.getRemoveAccess,
    config: {
      description: 'Manage licences - remove access form',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      },
      validate: {
        params: {
          colleagueEntityID: Joi.string().uuid().required()
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
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        },
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
      description: 'Manage licences - add access form',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      }
    }
  },
  postAddAccess: {
    method: 'POST',
    path: '/manage_licences/add_access',
    handler: controller.postAddAccess,
    config: {
      description: 'Manage licences - add access process',
      validate: {
        payload: {
          email: Joi.string().max(254).allow(''),
          returns: Joi.boolean(),
          csrf_token: Joi.string().guid().required()
        }
      },
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      }
    }
  },
  getAddLicences: {
    method: 'GET',
    path: '/manage_licences_add',
    handler: controller.getAddLicences,
    config: {
      description: 'Manage licences - add licences',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
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
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      },
      validate: {
        params: {
          colleagueEntityID: Joi.string().uuid().required()
        }
      }
    }
  }
};
