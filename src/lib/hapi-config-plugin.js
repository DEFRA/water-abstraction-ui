/**
* HAPI data plugin
* Allows data (e.g. config) to be attached to route config and sent to request.config
*
* @module lib/hapi-config-plugin
*/
const {contextDefaults} = require('./view');

const configPlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        const config = request.route.settings.plugins.config || {};

        request.config = config;

        // Continue processing request
        return reply.continue();
      }
    });

    return next();
  }
};

configPlugin.register.attributes = {
  name: 'config',
  version: '1.0.0'
};

module.exports = configPlugin;
