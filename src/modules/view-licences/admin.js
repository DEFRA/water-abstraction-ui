const { getLicences: baseGetLicences } = require('./base');

/**
 * Gets list of licences in admin section
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.emailAddress] - the email address to filter on
 * @param {String} [request.query.licenceNumber] - the licence number to search on
 * @param {String} [request.query.sort] - the field to sort on licenceNumber|name
 * @param {Number} [request.query.direction] - sort direction +1 : asc, -1 : desc
 * @param {Object} reply - the HAPI HTTP response
 */
async function getLicences (request, reply) {
  const { view } = request;

  // Only show result set if a query has been made
  if ('licenceNumber' in request.query) {
    view.showResults = true;
  }

  return baseGetLicences(request, reply);
}

module.exports = {
  getLicences
};
