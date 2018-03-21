/**
* HAPI error plugin
* allows us to switch on a holding page using environment variable
* e.g. holding_page=1
*
* @module lib/hapi-holding-page-plugin
*/
const holdingPagePlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        // Is holding page enabled?
        if (process.env.holding_page) {
          const { path } = request.url;
          const { ignore, redirect } = options;

          // Check to see if we should redirect
          if (!path.match(ignore) && !path.match(redirect)) {
            console.log(`Holding page: redirect to ${redirect}`);
            return reply.redirect(redirect);
          }
        }

        // Continue processing request
        return reply.continue();
      }
    });

    return next();
  }
};

holdingPagePlugin.register.attributes = {
  name: 'holdingPagePlugin',
  version: '1.0.0'
};

module.exports = holdingPagePlugin;
