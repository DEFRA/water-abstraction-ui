const services = require('./connectors/services');

exports.getLicenceData = (method, documentId, request) => {
  return services.water.licences[method](documentId);
};
