const { VALID_UTM } = require('../../lib/validators');
const controller = require('./controller');
const loginHelpers = require('../../lib/login-helpers');

module.exports = {

  index: {
    method: 'GET',
    path: '/',
    handler: controller.index,
    config: {
      validate: {
        query: VALID_UTM
      }
    }
  },

  404: {
    method: 'GET',
    path: '/{all*}',
    handler: controller.getNotFoundError,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      }
    }
  },

  getWelcome: {
    method: 'GET',
    path: '/welcome',
    handler: controller.getWelcome,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      pre: [{ method: loginHelpers.preRedirectIfAuthenticated }],
      plugins: {
        viewContext: {
          pageTitle: 'Sign in or create an account'
        }
      }
    }
  }
};
