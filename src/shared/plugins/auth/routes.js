const Joi = require('joi');
const controller = require('./controller');

module.exports = [
  {
    method: 'GET',
    path: '/signin',
    handler: controller.getSignin,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      // pre: [{ method: options.ifAuthenticated }],
      validate: {
        query: {
          flash: Joi.string().max(32),
          utm_source: Joi.string().max(254),
          utm_medium: Joi.string().max(254),
          utm_campaign: Joi.string().max(254)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Sign in',
          customTitle: 'Sign in - Manage your water abstraction or impoundment licence'
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/signin',
    handler: controller.postSignin,
    config: {
      description: 'Login form handler',
      auth: false,
      validate: {
        payload: {
          email: Joi.string().max(254).allow(''),
          password: Joi.string().max(128).allow('')
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Sign in - Manage your water abstraction or impoundment licence'
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/signout',
    config: {
      description: 'Logs user out of service'
    },
    handler: controller.getSignout
  },
  {
    method: 'GET',
    path: '/signed-out',
    options: {
      auth: false,
      description: 'Confirms the user has been signed out of service'
    },
    handler: controller.getSignedOut
  }
];
