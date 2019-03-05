const { pick } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const serviceRequest = require('../service-request');
const urlJoin = require('url-join');
const config = require('../../../../config');

const endpoint = urlJoin(config.services.water, '/returns');

/**
 * Get unified return view
 * @param {String} returnId
 * @return {Promise} resolves with data
 */
const getReturn = (returnId, versionNumber) => {
  const qs = {
    returnId
  };
  if (versionNumber) {
    qs.versionNumber = versionNumber;
  };

  return serviceRequest.get(endpoint, {
    qs
  });
};

/**
 * Posts return view back to water service, water service to store
 * it in the returns service / NALD import tables
 * @param {Object} data
 * @return {Promise} resolves with post response
 */
const postReturn = (body) => {
  return serviceRequest.post(endpoint, {
    body
  });
};

/**
 * Patch return header.  This method is on the water service, but only
 * updates limited info in the return row itself - status, received date
 * (and later under query flag)
 * @param {Object} return data
 * @return {Promise} resolves when patch complete
 */
const patchReturn = (data) => {
  const { returnId } = data;

  const body = pick(data, ['returnId', 'status', 'receivedDate', 'user', 'isUnderQuery']);

  return serviceRequest.patch(`${endpoint}/header`, {
    body,
    qs: { returnId }
  });
};

/**
 * Post to send XML return to water service
 * @param {string} fileData - file data to be sent as a string
 * @param {string} userName - userName of active user
 * @return {string} - JSON containing, eventId, filename, location, etc
 */
const postXML = async (xmlData, userName) => {
  const url = `${endpoint}/upload-xml`;

  return serviceRequest.post(url, { body: { fileData: xmlData, userName } });
};

const responseHandler = response => {
  throwIfError(response.error);
  return response.data;
};

/**
 * Preview summary/validation summary for bulk return XML upload before
 * submitting
 * @param  {String}  eventId - the water service event for tracking the upload
 * @param  {Object}  qs    - additional data to authorise the request
 * @param {String} qs.entityId - CRM individual entity ID for current user
 * @param {String} qs.companyId - CRM company ID for current selected company
 * @param {String} qs.userName - IDM email address of current user
 * @param {String} [returnId] - individual return to fetch, optional
 * @return {Promise} resolves with { error, data } -  data is array of returns
 */
const getUploadPreview = async (eventId, qs, returnId) => {
  const uri = urlJoin(endpoint, `/upload-preview/${eventId}`, returnId || '');
  const response = await serviceRequest.get(uri, { qs });
  return responseHandler(response);
};

module.exports = {
  getReturn,
  postReturn,
  patchReturn,
  postXML,
  getUploadPreview
};
