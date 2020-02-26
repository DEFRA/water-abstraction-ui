'use strict';

/**
 * HAPI error plugin
 * allows us to handle Joi errors and display an error page to the user
 * this is based on the hapi-error plugin: https://github.com/dwyl/hapi-error
 * however we needed a method to alter the view context being sent to the template
 *
 * @module lib/hapi-error-plugin
 */
const { get, pick } = require('lodash');

const getStatusCode = request => get(request, 'response.output.statusCode');

const is404 = request => getStatusCode(request) === 404;

const isIgnored = request =>
  get(request, 'route.settings.plugins.errorPlugin.ignore', false);

const isCsrfError = request =>
  get(request, 'response.data.isCsrfError', false);

const getErrorPageTitle = request => {
  return is404(request) ? 'We cannot find that page' : 'Something went wrong';
};

const getErrorPageContext = request => ({
  ...request.view,
  pageTitle: getErrorPageTitle(request)
});

const getErrorTemplate = request => {
  return `nunjucks/errors/${is404(request) ? '404' : 'error'}`;
};

const _handler = async (request, h) => {
  const res = request.response;
  const { pluginOptions } = h.realm;

  if (isIgnored(request) || !res.isBoom) {
    return h.continue;
  }

  // Destroy session for CSRF error
  if (isCsrfError(request)) {
    pluginOptions.logger.info(pick(res, ['error', 'message', 'statusCode', 'stack']));
    return request.logOut();
  }

  pluginOptions.logger.errorWithJourney('Unexpected error', res, request, pick(res, ['error', 'message', 'statusCode', 'stack']));

  // Render 404 or 500 page depending on statusCode
  const context = getErrorPageContext(request);
  const template = getErrorTemplate(request);
  const statusCode = getStatusCode(request);
  return h.view(template, context).code(statusCode);
};

const errorPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreResponse',
      method: _handler
    });
  },

  pkg: {
    name: 'errorPlugin',
    version: '2.0.0'
  }
};

module.exports = errorPlugin;
module.exports._handler = _handler;
