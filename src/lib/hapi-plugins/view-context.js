/**
 * HAPI data plugin
 * Allows data (e.g. config) to be attached to route config and sent to request.config
 *
 * @module lib/hapi-config-plugin
 */
const { contextDefaults } = require('../view');

const viewContextPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
<<<<<<< HEAD
        const viewContext = contextDefaults(request);

        const currentView = request.view || {};
        const viewData = request.route.settings.plugins.viewContext || {};

        request.view = { ...currentView, ...viewContext, ...viewData };
=======
        const currentView = request.view || {};
        const routeContext = request.route.settings.plugins.viewContext || {};
        request.view = Object.assign(currentView, routeContext);
        request.view = contextDefaults(request);
>>>>>>> Add main nav links with tests.  Use SASS from prototype.  Ensure view context is merged with route settings.

        // Continue processing request
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'viewContext',
    version: '2.0.0'
  }
};

module.exports = viewContextPlugin;
