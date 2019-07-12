'use strict';

const config = require('external/config');
const viewEngine = require('external/lib/view-engine');

const hapi = require('@hapi/hapi');

const createServer = async (route) => {
  const server = hapi.server();
  await server.register(require('@hapi/vision'));
  await server.register(require('hapi-auth-cookie'));
  await server.register(require('shared/plugins/config'));

  server.views(viewEngine);
  server.auth.strategy('standard', 'cookie', {
    ...config.hapiAuthCookie,
    validateFunc: () => {}
  });

  if (route) {
    server.route(route);
  }

  return server;
};

exports.createServer = createServer;
