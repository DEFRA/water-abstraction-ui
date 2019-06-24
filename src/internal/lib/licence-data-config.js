const services = require('./connectors/services');

exports.getLicenceData = (method, documentId) => {
  return services.water.licences[method](documentId);
};
