const { getLicences: baseGetLicences } = require('./base');

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
