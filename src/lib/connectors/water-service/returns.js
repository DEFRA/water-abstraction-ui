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
const getReturn = (returnId) => {
  return rp({
    method: 'GET',
    uri: endpoint,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    qs: {
      returnId
    },
    json: true
  });
};

module.exports = {
  getReturn
};
