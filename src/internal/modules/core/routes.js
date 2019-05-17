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

  staticAssets: {
    method: 'GET',
    path: '/public/{param*}',
    config: {
      auth: false,
      cache: {
        expiresIn: 30 * 1000
      }
    },
    handler: {
      directory: {
        path: 'public/',
        listing: false
      }
    }
  },

  govUkFrontendAssets: {
    method: 'GET',
    path: '/assets/{param*}',
    config: {
      description: 'Serve static assets for GOV.UK frontend',
      auth: false,
      cache: {
        expiresIn: 30 * 1000
      }
    },
    handler: {
      directory: {
        path: 'node_modules/govuk-frontend/assets/',
        listing: false
      }
    }
  },

  govUkFrontendJS: {
    method: 'GET',
    path: '/assets/js/all.js',
    config: {
      description: 'Serve static assets for GOV.UK frontend',
      auth: false,
      cache: {
        expiresIn: 30 * 1000
      }
    },
    handler: {
      file: 'node_modules/govuk-frontend/all.js'
    }
  },

  robots: {
    method: 'GET',
    path: '/robots.txt',
    handler: () => 'User-agent: * Disallow: /',
    config: { auth: false, description: 'Ooh. Robots' }
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
