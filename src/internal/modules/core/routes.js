const { VALID_UTM } = require('shared/lib/validators');
const controller = require('./controller');

module.exports = {

  index: {
    method: 'GET',
    path: '/',
    handler: controller.index,
    config: {
      validate: {
        query: VALID_UTM
      },
      plugins: {
        companySelector: {
          ignore: true
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

  status: {
    method: 'GET',
    path: '/status',
    handler: () => 'OK',
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      }
    }
  }
};
