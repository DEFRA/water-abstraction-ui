'use strict';

const idmConnectors = require('./idm');
const crmConnectors = require('./crm');

module.exports = {
  name: 'connectors',
  version: '1.0.0',
  register: async function (server, options) {
    const map = {
      idm: idmConnectors(options.config),
      crm: crmConnectors(options.config)
    };
    server.method('getConnector', key => map[key]);
  }
};
