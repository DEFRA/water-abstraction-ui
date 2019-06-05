const { throwIfError } = require('@envage/hapi-pg-rest-api');
const permissions = require('./permissions');

class LicenceDataConfig {
  constructor (config, connectors) {
    this.connectors = connectors;
  }

  _getOptions (request) {
    if (permissions.isInternal(request)) {
      return { includeExpired: true };
    }
    return { companyId: request.defra.companyId };
  }

  async _callWaterMethod (method, request, documentId) {
    const options = this._getOptions(request);
    const { error, data } = await this.connectors.water.licences[method](documentId, options);
    throwIfError(error);
    return data;
  }

  getSummaryByDocumentId (request, documentId) {
    return this._callWaterMethod('getSummaryByDocumentId', request, documentId);
  }

  getCommunicationsByDocumentId (request, documentId) {
    return this._callWaterMethod('getCommunicationsByDocumentId', request, documentId);
  }
}

module.exports = LicenceDataConfig;
