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
    console.log('----- errorHandler -----');

    // Log with good
    request.log(err);

    const statusCode = err.isBoom ? (err.output.statusCode || 500) : 500;

    // Log error
    if (statusCode === 500) {
      console.error(err);
    } else {
      console.log(err);
    }

    // Create view context
    const {session} = request;

    // Not found
    if (statusCode === 404) {
      reply.view('water/404.html', {session}).code(statusCode);
    } else if (statusCode >= 401 && statusCode <= 403) {
      // Unauthorised
      reply.redirect('/login');
    } else {
      // Other error
      const viewContext = {
        topOfPage: null,
        bodyStart: null,
        session,
        pageTitle: 'Error'
      };
      reply.view('water/error.html', viewContext).code(statusCode);
    }
  };
};
