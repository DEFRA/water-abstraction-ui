/**
 * HAPI error plugin
 * allows us to handle Joi errors and display an error page to the user
 * this is based on the hapi-error plugin: https://github.com/dwyl/hapi-error
 * however we needed a method to alter the view context being sent to the template
 *
 * @module lib/hapi-error-plugin
 */
const { contextDefaults } = require('../view');
const logger = require('../logger');
const { get } = require('lodash');

const errorPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreResponse',
      method: async (request, reply) => {
        const res = request.response;

        // Create view context
        const view = contextDefaults(request);

        const ignore = get(request, 'route.settings.plugins.errorPlugin.ignore', false);

        // Boom errors
        if (!ignore && res.isBoom) {
          // ALWAYS Log the error
          logger.error(res);

          const { statusCode } = res.output;

          // CSRF error detected - sign out user and redirect to login page
          if (res.data && res.data.isCsrfError) {
            await request.sessionStore.destroy();
            request.cookieAuth.clear();
            return reply.redirect('/signout');
          }

          // Unauthorised
          if (statusCode >= 401 && statusCode <= 403) {
            return reply.redirect('/welcome');
          }
          // Not found
          if (statusCode === 404) {
            view.pageTitle = "We can't find that page";
            return reply.view('water/404.html', view).code(statusCode);
          }
          // Other errors
          view.pageTitle = 'Something went wrong';
          return reply.view('water/error.html', view).code(statusCode);
        }

        // Continue processing request
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'errorPlugin',
    version: '2.0.0'
  }
};

module.exports = errorPlugin;
