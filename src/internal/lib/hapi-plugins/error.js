/**
 * HAPI error plugin
 * allows us to handle Joi errors and display an error page to the user
 * this is based on the hapi-error plugin: https://github.com/dwyl/hapi-error
 * however we needed a method to alter the view context being sent to the template
 *
 * @module lib/hapi-error-plugin
 */
const { contextDefaults } = require('../view');
const { logger } = require('../../logger');
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

const _handler = async (request, h) => {
  const res = request.response;

  if (isIgnored(request) || !res.isBoom || is404(request)) {
    return h.continue;
  }

  // Destroy session for CSRF error
  if (isCsrfError(request)) {
    logger.info(pick(res, ['error', 'message', 'statusCode', 'stack']));
    return request.logOut();
  }

  // Unauthorised - redirect to sign in
  if (isUnauthorized(request)) {
    logger.info(pick(res, ['error', 'message', 'statusCode', 'stack']));
    return h.redirect('/signin');
  }

  logger.error(pick(res, ['error', 'message', 'statusCode', 'stack']));

  // Render 500 page
  const view = {
    ...contextDefaults(request),
    pageTitle: 'Something went wrong'
  };
  const statusCode = getStatusCode(request);
  return h.view('nunjucks/errors/error.njk', view, { layout: false }).code(statusCode);
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
