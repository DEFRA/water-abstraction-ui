/**
* HAPI data plugin
* Allows data (e.g. config) to be attached to route config and sent to request.config
*
* @module lib/hapi-config-plugin
*/
const {contextDefaults} = require('./view');

const viewContextPlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        const viewContext = contextDefaults(request);

        const viewData = request.route.settings.plugins.viewContext || {};

        request.view = { ...viewContext, ...viewData };

        // Continue processing request
        return reply.continue();
      }
    });

    return next();
  }
};

viewContextPlugin.register.attributes = {
  name: 'viewContext',
  version: '1.0.0'
};

module.exports = viewContextPlugin;
