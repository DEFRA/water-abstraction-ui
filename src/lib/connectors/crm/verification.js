/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-verification
 */
const { APIClient } = require('hapi-pg-rest-api');
const moment = require('moment');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false,
});

// Create API client
module.exports = new APIClient(rp, {
  endpoint: `${ process.env.CRM_URI }/verification`,
  headers: {
    Authorization: process.env.JWT_TOKEN,
  },
});
