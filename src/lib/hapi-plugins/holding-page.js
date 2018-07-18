/**
 * HAPI error plugin
 * allows us to switch on a holding page using environment variable
 * e.g. holding_page=1
 *
 * @module lib/hapi-plugins/holding-page
 */
const holdingPagePlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        const { ignore, redirect, enabled } = options;

        // Is holding page enabled?
        if (enabled) {
          const { path } = request.url;

          // Check to see if we should redirect
          if (!path.match(ignore) && !path.match(redirect)) {
            request.log('info', `Holding page: redirect to ${redirect}`);
            return reply.redirect(redirect);
          }
        }

        // Continue processing request
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'holdingPagePlugin',
    version: '2.0.0'
  }
};

module.exports = holdingPagePlugin;
