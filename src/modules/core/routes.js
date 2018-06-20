const { VALID_UTM } = require('../../lib/validators');
const controller = require('./controller');

module.exports = {

  index: {
    method: 'GET',
    path: '/',
    handler: controller.index,
    config: {
      auth: false,
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

  robots: {
    method: 'GET',
    path: '/robots.txt',
    handler: () => 'User-agent: * Disallow: /',
    config: { auth: false, description: 'Ooh. Robots' }
  }
};
