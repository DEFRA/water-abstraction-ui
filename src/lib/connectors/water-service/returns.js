const { pick } = require('lodash');
const serviceRequest = require('../service-request');
const files = require('../../files');

const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const endpoint = `${process.env.WATER_URI}/returns`;

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

  return rp({
    method: 'GET',
    uri: endpoint,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    qs,
    json: true
  });
};

/**
 * Posts return view back to water service, water service to store
 * it in the returns service / NALD import tables
 * @param {Object} data
 * @return {Promise} resolves with post response
 */
const postReturn = (data) => {
  return rp({
    method: 'POST',
    uri: endpoint,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    body: data,
    json: true
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

  return rp({
    method: 'PATCH',
    uri: `${endpoint}/header`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    body,
    json: true,
    qs: { returnId }
  });
};

/**
 * Post to send XML return to water service
 * @param {string} file - name & location of temp file
 * @param {string} userName - userName of active user
 * @return {string} - JSON containing, eventId, filename, location, etc
 */
const postXML = async (file, userName) => {
  const url = `${endpoint}/upload-xml`;
  const fileData = await files.readFile(file);

  return serviceRequest.post(url, { body: { fileData: fileData.toString(), userName } });
};

module.exports = {
  getReturn,
  postReturn,
  patchReturn,
  postXML
};
