'use strict';
const hoek = require('@hapi/hoek');

const routes = require('./routes');

module.exports = {
  name: 'resetPasswordPlugin',
  version: '1.0.0',
  register: async function (server, options) {
    // Validate plugin options
    hoek.assert(typeof options.resetPassword === 'function', 'resetPassword must be a function');
    hoek.assert(typeof options.getUserByResetGuid === 'function', 'getUserByResetGuid must be a function');
    hoek.assert(typeof options.updatePasswordWithGuid === 'function', 'updatePasswordWithGuid must be a function');

    // Import routes
    server.route(routes);
  }
};
