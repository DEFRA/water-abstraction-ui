const { throwIfError } = require('@envage/hapi-pg-rest-api');

const callWaterMethod = async (connectors, method, documentId, options) => {
  const { error, data } = await connectors.water.licences[method](documentId, options);
  throwIfError(error);
  return data;
};

class LicenceDataConfig {
  constructor (config, connectors) {
    this.connectors = connectors;
  }

  mapRequestToOptions (request) {
    return {};
  }

  getSummaryByDocumentId (documentId, request) {
    return callWaterMethod(this.connectors, 'getSummaryByDocumentId', documentId, this.mapRequestToOptions(request));
  }

  getCommunicationsByDocumentId (documentId, request) {
    return callWaterMethod(this.connectors, 'getCommunicationsByDocumentId', documentId, this.mapRequestToOptions(request));
  }
}

module.exports = LicenceDataConfig;
