const { throwIfError } = require('@envage/hapi-pg-rest-api');

class LicenceDataConfig {
  constructor (config, connectors) {
    this.connectors = connectors;
  }

  _getOptions (request) {
    return { companyId: request.defra.companyId };
  }

  async _callWaterMethod (method, documentId, request) {
    const options = this._getOptions(request);
    const { error, data } = await this.connectors.water.licences[method](documentId, options);
    throwIfError(error);
    return data;
  }

  getSummaryByDocumentId (documentId, request) {
    return this._callWaterMethod('getSummaryByDocumentId', documentId, request);
  }

  getCommunicationsByDocumentId (documentId, request) {
    return this._callWaterMethod('getCommunicationsByDocumentId', documentId, request);
  }
}

module.exports = LicenceDataConfig;
