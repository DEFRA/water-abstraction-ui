const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const endpoint = `${process.env.WATER_URI}/user`;

const getUserStatus = userId => {
  const uri = `${endpoint}/${userId}/status`;

  return rp({
    method: 'GET',
    uri,
    headers: { Authorization: process.env.JWT_TOKEN },
    json: true
  });
};

module.exports = {
  getUserStatus
};
