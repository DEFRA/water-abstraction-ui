
const {
  APIClient
} = require('hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

// Create API client
const client = new APIClient(rp, {
  endpoint: `${process.env.CRM_URI}/kpi`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

module.exports = client;
