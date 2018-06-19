const Joi = require('joi');
const VmL = require('../lib/VmL');

// const LicencesController = require('../controllers/licences');
const AuthController = require('../controllers/authentication');
const RegistrationController = require('../controllers/registration');
const LicencesAddController = require('../controllers/licences-add');
const LicencesManageController = require('../controllers/licences-manage');

/**
Note the workaround for path / to serve static file for root path (so as not to use a view and get extrab headers, footers, etc)
**/

module.exports = [

  {
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      const { permissions } = request;
      if (permissions && permissions.admin.defra) {
        return reply.redirect('/admin/licences');
      } else {
        return reply.redirect('/licences');
      }
    },
    config: {
      auth: false,
      validate: {
        query: {
          access: Joi.string().max(4),
          utm_source: Joi.string().max(254),
          utm_medium: Joi.string().max(254),
          utm_campaign: Joi.string().max(254)
        }
      }
    }
  },

  {
    method: 'GET',
    path: '/private-beta-closed',
    config: {
      auth: false,
      description: 'Holding page for private beta'
    },
    handler: VmL.getHoldingPage
  },

  { method: 'GET', path: '/robots.txt', handler: function (request, reply) { return reply('User-agent: * Disallow: /').code(200); }, config: { auth: false, description: 'Ooh. Robots' } },
  { method: 'GET', path: '/feedback', config: { auth: false }, handler: VmL.getFeedback },
  { method: 'GET', path: '/cookies', config: { description: 'Displays cookie information', auth: false }, handler: VmL.getCookies },
  { method: 'GET', path: '/privacy-policy', config: { description: 'Displays privacy policy', auth: false }, handler: VmL.getPrivacyPolicy },
  {
    method: 'GET',
    path: '/accessibility',
    config: { description: 'Displays an accessibility statement', auth: false },
    handler: VmL.getAccessibility
  },
  { method: 'GET', path: '/tmp', config: { auth: false }, handler: VmL.getRoot },
  { method: 'GET', path: '/signout', config: {}, handler: AuthController.getSignout },

  {
    method: 'GET',
    path: '/welcome',
    handler: AuthController.getWelcome,
    config: {
      auth: false
    }
  },

  {
    method: 'GET',
    path: '/signin',
    handler: AuthController.getSignin,
    config: {
      auth: false,
      validate: {
        query: {
          flash: Joi.string().max(32),
          utm_source: Joi.string().max(254),
          utm_medium: Joi.string().max(254),
          utm_campaign: Joi.string().max(254)
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/signin',
    handler: AuthController.postSignin,
    config: {
      description: 'Login form handler',
      auth: false,
      validate: {
        payload: {
          user_id: Joi.string().max(254).allow(''),
          password: Joi.string().max(128).allow('')
        }
      }
    }
  },

  // Registration process
  {
    method: 'GET',
    path: '/start',
    handler: RegistrationController.getRegisterStart,
    config: {
      auth: false,
      description: 'Register start page - information for users before registering'
    }
  },
  {
    method: 'GET',
    path: '/register',
    handler: RegistrationController.getEmailAddress,
    config: {
      auth: false,
      description: 'Register user account - get email address'
    }
  },
  {
    method: 'POST',
    path: '/register',
    handler: RegistrationController.postEmailAddress,
    config: {
      auth: false,
      description: 'Register user account - email address form handler',
      validate: {
        payload: {
          email: Joi.string().allow('').max(254)
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/success',
    handler: RegistrationController.getRegisterSuccess,
    config: {
      auth: false,
      description: 'Register user account - success page'
    }
  },
  {
    method: 'GET',
    path: '/send-again',
    handler: RegistrationController.getSendAgain,
    config: {
      auth: false,
      description: 'Register user account - resend email form'
    }
  },
  {
    method: 'POST',
    path: '/send-again',
    handler: RegistrationController.postSendAgain,
    config: {
      auth: false,
      description: 'Register user account - resend email address form handler',
      validate: {
        payload: {
          email: Joi.string().allow('').max(254)
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/resent-success',
    handler: RegistrationController.getResentSuccess,
    config: {
      auth: false,
      description: 'Register user account - email resent success page'
    }
  },

  // Manage licences
  {
    method: 'GET',
    path: '/manage_licences',
    handler: LicencesManageController.getManage,
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
  {
    method: 'GET',
    path: '/manage_licences/access',
    handler: LicencesManageController.getAccessList,
    config: {
      description: 'Manage licences - give/remove access',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/manage_licences/remove_access',
    handler: LicencesManageController.getRemoveAccess,
    config: {
      description: 'Manage licences - remove access form',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/manage_licences/add_access',
    handler: LicencesManageController.getAddAccess,
    config: {
      description: 'Manage licences - add access form',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/manage_licences/add_access',
    handler: LicencesManageController.postAddAccess,
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
  {
    method: 'GET',
    path: '/manage_licences_add',
    handler: LicencesManageController.getAddLicences,
    config: {
      description: 'Manage licences - add licences',
      plugins: {
        hapiRouteAcl: {
          permissions: ['licences:edit']
        }
      }
    }
  },

  // Add licence to account
  {
    method: 'GET',
    path: '/add-licences',
    handler: LicencesAddController.getLicenceAdd,
    config: {
      description: 'Start flow to add licences'
    }
  },
  {
    method: 'POST',
    path: '/add-licences',
    handler: LicencesAddController.postLicenceAdd,
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
  {
    method: 'GET',
    path: '/select-licences',
    handler: LicencesAddController.getLicenceSelect,
    config: {
      description: 'Select the licences to add',
      validate: {
        query: {
          error: Joi.string().max(32)
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/select-licences',
    handler: LicencesAddController.postLicenceSelect,
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
  {
    method: 'GET',
    path: '/select-licences-error',
    handler: LicencesAddController.getLicenceSelectError,
    config: {
      description: 'Error uploading licences - show contact information'
    }
  },

  {
    method: 'GET',
    path: '/select-address',
    handler: LicencesAddController.getAddressSelect,
    config: {
      description: 'Select the address to send postal verification letter',
      validate: {
        query: {
          error: Joi.string().allow('').max(32)
        }
      }
    }
  },

  {
    method: 'POST',
    path: '/select-address',
    handler: LicencesAddController.postAddressSelect,
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
  {
    method: 'GET',
    path: '/security-code',
    handler: LicencesAddController.getSecurityCode,
    config: {
      description: 'Enter auth code received by post'
    }
  },
  {
    method: 'POST',
    path: '/security-code',
    handler: LicencesAddController.postSecurityCode,
    config: {
      description: 'Enter auth code received by post',
      validate: {
        payload: {
          verification_code: Joi.string().allow('').max(5),
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  },
  // {
  //   method: 'GET',
  //   path: '/dashboard',
  //   handler: VmL.dashboard,
  //   config: {
  //     description: 'System Dashboard',
  //     plugins: {
  //       hapiRouteAcl: {
  //         permissions: ['admin:defra']
  //       }
  //     }
  //   }
  // },

  // { method: 'GET',
  //   path: '/system/performance/dashboard/v1',
  //   handler: VmL.dashboard,
  //   config: {
  //     description: 'Show the dashboard'
  //   }},

  {
    method: '*',
    path: '/{p*}', // catch-all path
    handler: VmL.fourOhFour
  }

];
