const { withQueryStringSubset } = require('../../lib/url');

/**
 * Provides a controller handler that will redirect to /licences.
 *
 * If this request includes the _ga query param this will be forwards to the
 * licences pages to enable cross domain tracking in the .gov.uk domains.
 *
 * /licences requires authentication to access and this check will be handled
 * by the HapiAuthCookie plugin which is also configured to forward the query
 * param on redirect.
 *
 * @param {Object} request HAPI JS request object
 * @param {Object} h HAPI JS response toolkit
 */
const index = async (request, h) => {
  const url = withQueryStringSubset('/licences', request.query, '_ga');
  return h.redirect(url);
};

/**
 * Welcome page before routing to signin/register
 */
function getWelcome (request, h) {
  return h.view('nunjucks/core/welcome', request.view);
}

/**
 * 404 page
 */
const getNotFoundError = (request, h) => {
  const view = {
    ...request.view,
    pageTitle: 'We cannot find that page'
  };
  return h
    .view('nunjucks/errors/404', view)
    .code(404);
};

exports.index = index;
exports.getWelcome = getWelcome;
exports.getNotFoundError = getNotFoundError;
