/**
 * An error handler function used to handle Boom errors in catch block of HAPI
 * route handlers.
 * Depending on HTTP status code, either displays 404, error page, or redirects
 * to login page
 *
 * @module lib/error-handler
 * @param {Object} request - HAPI HTTP request instance
 * @param {Object} reply - HAPI HTTP reply instance
 * @return {Function} - error handler function
 *
 * @example
 * asyncCode.then(() => {
 *   throw Boom.notFound('Page not found')
 * }).catch(errorHandler(request, reply))
 */

module.exports = function (request, reply) {
  return function (err) {
    console.error(`Calling error-handler.js is deprecated, use hapi-error-plugin instead`);
    reply(err);
  };
};
