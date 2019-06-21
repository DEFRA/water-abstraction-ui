const services = require('./connectors/services');

exports.getLicenceData = (method, documentId, request) => {
  const { companyId } = request.defra;
  return services.water.licences[method](documentId, companyId);
};
