const { testMode } = require('../../../config');
const controller = require('./controller');

module.exports = testMode ? {
  getLogs: {
    method: 'GET',
    path: '/api/1.0/nald/logs',
    handler: controller.getLogs,
    config: {
      auth: 'jwt'
    }
  },

  getLines: {
    method: 'GET',
    path: '/api/1.0/nald/lines',
    handler: controller.getLines,
    config: {
      auth: 'jwt'
    }
  }

} : {};
