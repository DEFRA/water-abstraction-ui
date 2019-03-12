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
const { get, pick } = require('lodash');

const getStatusCode = request => get(request, 'response.output.statusCode');

const is404 = request => getStatusCode(request) === 404;

const isIgnored = request =>
  get(request, 'route.settings.plugins.errorPlugin.ignore', false);

const isCsrfError = request =>
  get(request, 'response.data.isCsrfError', false);

const isUnauthorized = request => {
  const statusCode = getStatusCode(request);
  return (statusCode >= 401 && statusCode <= 403);
};

const errorPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreResponse',
      method: async (request, h) => {
        const res = request.response;

        // Create view context
        const view = contextDefaults(request);

        if (!isIgnored(request) && res.isBoom && !is404(request)) {
          // ALWAYS Log the error
          logger.info(pick(res, ['error', 'message', 'statusCode', 'stack']));

          // Destroy session for CSRF error
          if (isCsrfError(request)) {
            await request.sessionStore.destroy();
            request.cookieAuth.clear();
            return h.redirect('/signout');
          }

          // Unauthorised - redirect to welcome
          if (isUnauthorized(request)) {
            return h.redirect('/welcome');
          }

          // Render 500 page
          const statusCode = getStatusCode(request);
          view.pageTitle = 'Something went wrong';
          return h.view('water/error.html', view).code(statusCode);
        }

        return h.continue;
      }
    });
  },

  pkg: {
    name: 'errorPlugin',
    version: '2.0.0'
  }
};

module.exports = errorPlugin;
