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

module.exports = {
  getReturn,
  postReturn
};
