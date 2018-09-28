const { getSessionData } = require('./lib/session-helpers');
const { getViewData } = require('./lib/helpers');

const returnsPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        if (request.route.settings.plugins.returns) {
          const data = getSessionData(request);
          const view = await getViewData(request, data);

          request.returns = {
            data,
            view,
            isInternal: request.permissions.hasPermission('admin.defra')
          };
        }
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'returnsPlugin',
    version: '2.0.0'
  }
};

module.exports = returnsPlugin;
