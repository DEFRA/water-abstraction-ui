const ServiceClient = require('../ServiceClient');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const responseHandler = response => {
  throwIfError(response.error);
  return response.data;
};

class ReturnsService extends ServiceClient {
  /**
    * Get unified return view
    * @param {String} returnId
    * @return {Promise} resolves with data
    */
  getReturn (returnId, versionNumber) {
    const qs = versionNumber
      ? { returnId, versionNumber }
      : { returnId };

    const url = this.joinUrl('returns');
    return this.serviceRequest.get(url, { qs });
  };

  /**
    * Posts return view back to water service, water service to store
    * it in the returns service / NALD import tables
    * @param {Object} data
    * @return {Promise} resolves with post response
    */
  postReturn (body) {
    const url = this.joinUrl('returns');
    return this.serviceRequest.post(url, { body });
  };

  /**
    * Post to send XML return to water service
    * @param {string} fileData - file data to be sent as a string
    * @param {string} userName - userName of active user
    * @param {String} type - the file type, supported is 'xml', 'csv'
    * @return {string} - JSON containing, eventId, filename, location, etc
    */
  postUpload (fileData, userName, companyId, type = 'csv') {
    const url = this.joinUrl('returns/upload', type.toLowerCase());
    return this.serviceRequest.post(url, { body: { fileData, userName, companyId } });
  }

  /**
    * POST to finally submit and finalise the valid uploaded returns
    * @param  {String} eventId - the water service event for tracking the upload
    * @param  {Object} qs    - additional data to authorise the request
    * @param {String} qs.entityId - CRM individual entity ID for current user
    * @param {String} qs.companyId - CRM company ID for current selected company
    * @param {String} qs.userName - IDM email address of current user
    * @return {Promise} resolves with { error, data } -  data is array of returns
    */
  async postUploadSubmit (eventId, qs) {
    const uri = this.joinUrl('returns/upload-submit', eventId);
    const response = await this.serviceRequest.post(uri, { qs });
    return responseHandler(response);
  }

  /**
   * Preview summary/validation summary for bulk return XML upload before
   * submitting
   * @param  {String}  eventId - the water service event for tracking the upload
   * @param  {Object}  qs    - additional data to authorise the request
   * @param {String} qs.entityId - CRM individual entity ID for current user
   * @param {String} qs.companyId - CRM company ID for current selected company
   * @param {String} qs.userName - IDM email address of current user
   * @param {String} [returnId] - individual return to fetch, optional
   * @return {Promise} resolves with array of returns
   */
  async getUploadPreview (eventId, qs, returnId) {
    const uri = this.joinUrl('returns/upload-preview', eventId, returnId);
    const response = await this.serviceRequest.get(uri, { qs });
    return responseHandler(response);
  }
}

module.exports = ReturnsService;
