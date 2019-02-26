const Joi = require('joi');
const controller = require('./controller');

module.exports = {

  getWelcome: {
    method: 'GET',
    path: '/welcome',
    handler: controller.getWelcome,
    config: {
      auth: false,
      plugins: {
        viewContext: {
          pageTitle: 'Sign in or create an account'
        }
      }
    }
  },

  getSignIn: {
    method: 'GET',
    path: '/signin',
    handler: controller.getSignin,
    config: {
      auth: false,
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

  postSignIn: {
    method: 'POST',
    path: '/signin',
    handler: controller.postSignin,
    config: {
      description: 'Login form handler',
      auth: false,
      validate: {
        payload: {
          user_id: Joi.string().max(254).allow(''),
          password: Joi.string().max(128).allow('')
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Sign in - Manage your water abstraction or impoundment licence'
        },
        formValidator: {
          payload: {
            user_id: Joi.string().email().required(),
            password: Joi.string().required()
          }
        }
      }
    }
  },

  getSignOut: {
    method: 'GET',
    path: '/signout',
    config: {
      description: 'Logs user out of service'
    },
    handler: controller.getSignout
  },

  getSignedOut: {
    method: 'GET',
    path: '/signed-out',
    options: {
      auth: false,
      description: 'Confirms the user has been signed out of service'
    },
    handler: controller.getSignedOut
  },

  getSelectCompany: {
    method: 'GET',
    path: '/select-company',
    handler: controller.getSelectCompany,
    options: {

      description: 'Allows the user to select their company'
    }
  },

  postSelectCompany: {
    method: 'POST',
    path: '/select-company',
    handler: controller.postSelectCompany,
    options: {
      description: 'Allows the user to select their company',
      validate: {
        payload: {
          company: Joi.number(),
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  }
};
