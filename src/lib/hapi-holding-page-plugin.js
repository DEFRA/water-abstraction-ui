/**
* HAPI error plugin
* allows us to switch on a holding page using environment variable
* e.g. holding_page=1
*
* @module lib/hapi-holding-page-plugin
*/
const { contextDefaults } = require('./view');

const holdingPagePlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        if (process.env.holding_page && !request.url.path.match('/public/')) {
          const viewContext = {
            ...contextDefaults(request),
            pageTitle: 'The test version of this service is now closed'
          };
          return reply.view('water/holding_page', viewContext);
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
