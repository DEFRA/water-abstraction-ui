const Joi = require('joi');
const controller = require('./controller');
const loginHelpers = require('../../lib/login-helpers');

module.exports = {
  getStart: {
    method: 'GET',
    path: '/start',
    handler: controller.getRegisterStart,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      pre: [{ method: loginHelpers.preRedirectIfAuthenticated }],
      description: 'Register start page - information for users before registering',
      plugins: {
        viewContext: {
          pageTitle: 'Create an account to manage your water abstraction licence online'
        }
      }
    }
  },
  getRegister: {
    method: 'GET',
    path: '/register',
    handler: controller.getEmailAddress,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      pre: [{ method: loginHelpers.preRedirectIfAuthenticated }],
      description: 'Register user account - get email address',
      plugins: {
        viewContext: {
          pageTitle: 'Create an account'
        }
      }
    }
  },
  postRegister: {
    method: 'POST',
    path: '/register',
    handler: controller.postEmailAddress,
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
  getSuccess: {
    method: 'GET',
    path: '/success',
    handler: controller.getRegisterSuccess,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      pre: [{ method: loginHelpers.preRedirectIfAuthenticated }],
      description: 'Register user account - success page',
      plugins: {
        viewContext: {
          pageTitle: 'Confirm your email address'
        }
      },
      validate: {
        query: {
          email: Joi.string().required().max(254)
        }
      }
    }
  },
  getSendAgain: {
    method: 'GET',
    path: '/send-again',
    handler: controller.getSendAgain,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      pre: [{ method: loginHelpers.preRedirectIfAuthenticated }],
      description: 'Register user account - resend email form',
      plugins: {
        viewContext: {
          pageTitle: 'Request another email'
        }
      }
    }
  },
  postSendAgain: {
    method: 'POST',
    path: '/send-again',
    handler: controller.postSendAgain,
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
  getResentSuccess: {
    method: 'GET',
    path: '/resent-success',
    handler: controller.getResentSuccess,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      pre: [{ method: loginHelpers.preRedirectIfAuthenticated }],
      description: 'Register user account - email resent success page',
      plugins: {
        viewContext: {
          pageTitle: 'Confirm your email address'
        }
      }
    }
  }
};
