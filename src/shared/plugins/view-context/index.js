/**
 * HAPI data plugin
 * Allows data (e.g. config) to be attached to route config and sent to request.config
 *
 * @module lib/hapi-config-plugin
 */
const viewContextPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, h) => {
        const getContextDefaults = options.getContextDefaults;

        if (!getContextDefaults) {
          throw new Error('viewContext plugin requires the options.getContextDefaults function');
        }

        const currentView = request.view || {};
        const routeContext = request.route.settings.plugins.viewContext || {};
        request.view = Object.assign(currentView, routeContext);
        request.view = getContextDefaults(request);

        // Continue processing request
        return h.continue;
      }
    });
  },

  pkg: {
    name: 'viewContext',
    version: '2.0.0'
  }
};

module.exports = viewContextPlugin;
