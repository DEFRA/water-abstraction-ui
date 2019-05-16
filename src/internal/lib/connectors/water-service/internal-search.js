const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const getInternalSearchResults = (query, page = 1) => {
  const uri = `${process.env.WATER_URI}/internal-search`;
  const options = {
    uri,
    method: 'GET',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    qs: {
      query,
      page
    },
    json: true
  };
  return rp(options);
};

module.exports = {
  getInternalSearchResults
};
