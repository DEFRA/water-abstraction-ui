const Joi = require('joi');
const { VALID_UTM } = require('shared/lib/validators');
const controller = require('./controller');
const loginHelpers = require('../../lib/login-helpers');
const pkg = require('../../../../package.json');
const { version } = pkg;

module.exports = {

  index: {
    method: 'GET',
    path: '/',
    handler: controller.index,
    config: {
      validate: {
        // this is a potential entry point from
        // https://www.gov.uk/guidance/manage-your-water-abstraction-or-impoundment-licences-online
        // which may include the _ga query param. In this route, keep the value to pass on in
        // the redirect.
        //
        // Plus allow any other values that may appear but don't parse into request.query
        // because they are of no use at the moment, but it prevents a 400 response if
        // they appear (potentially via google analytics)
        query: {
          ...VALID_UTM,
          _ga: Joi.any().optional()
        },
        options: {
          stripUnknown: true
        }
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

  /**
   * This is another route that could receive the _ga query param
   * but this route validates no other params, so all are allowed.
   *
   * If ever a query param was validated here, ensure that the _ga
   * param is also allowed.
   */
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
  },

  status: {
    method: 'GET',
    path: '/status',
    handler: () => ({ version }),
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      }
    }
  }
};
