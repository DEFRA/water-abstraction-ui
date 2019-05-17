'use strict';
const routes = require('./routes');

module.exports = {
  name: 'authPlugin',
  version: '1.0.0',
  register: async function (server, options) {
    // Import routes
    server.route(routes);
  }
};
