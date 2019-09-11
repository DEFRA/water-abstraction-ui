const services = require('./connectors/services');

exports.getLicenceData = (method, documentId) => {
  if (method === 'getChargeVersionsByDocumentId') {
    return services.water.chargeVersions[method](documentId);
  }
  return services.water.licences[method](documentId, { includeExpired: true });
};
