const services = require('./connectors/services');

exports.getLicenceData = (method, documentId, request) => {
  const { companyId } = request.defra;
  const options = companyId ? { companyId } : {};

  return services.water.licences[method](documentId, options);
};
