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
    path: '/manage_licences/remove_access',
    handler: controller.getRemoveAccess,
    config: {
      description: 'Manage licences - remove access form',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
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
  }
};
