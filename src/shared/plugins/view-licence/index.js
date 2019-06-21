'use strict';

const routes = require('./routes');

module.exports = {
  name: 'viewLicencesPlugin',
  version: '1.0.0',
  register: async function (server, options) {
    server.dependency('licenceDataPlugin');

    // Import routes
    server.route(routes(options.allowedScopes));
  }
};
