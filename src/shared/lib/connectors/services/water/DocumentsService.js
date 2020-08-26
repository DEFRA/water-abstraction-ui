const ServiceClient = require('../ServiceClient');

class DocumentsService extends ServiceClient {
  /**
   * Gets due returns in the current returns cycle for the specified company
   * @param  {String} entityId - company entity ID GUID
   * @return {Promise<Array>} resolves with an array of returns
   */
  postLicenceRename (entityId, body) {
    const url = this.joinUrl('documents', entityId, 'rename');
    return this.serviceRequest.post(url, { body });
  }
}

module.exports = DocumentsService;
