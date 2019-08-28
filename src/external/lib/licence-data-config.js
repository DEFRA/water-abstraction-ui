const services = require('./connectors/services');

exports.getLicenceData = (method, documentId, request) => {
  // To be added soon, but currently only for internal users.
  if (method === 'getChargeVersionsByDocumentId') {
    return [];
  }

  const { companyId } = request.defra;
  const options = companyId ? { companyId } : {};

  return services.water.licences[method](documentId, options);
};
