const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const { APIClient } = require('@envage/hapi-pg-rest-api');

/**
 * This endpoint in the water service contains summary data around the status
 * of abstraction reform licences which are being processed
 * @type {APIClient}
 */
const arLicenceAnalyis = new APIClient(rp, {
  endpoint: `${process.env.WATER_URI}/ar/licences`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * This webhook in the water service causes the status of the abstraction reform
 * licence to be refreshed in the analysis table.
 * It should be called whenever an AR licence is mutated
 * @param  {String} licenceRef - licence number
 * @return {Promise}            resolves when licence has been refreshed
 */
const arRefreshLicenceWebhook = (licenceRef) => {
  const uri = `${process.env.WATER_URI}/ar/${licenceRef}`;
  return rp({
    uri,
    method: 'POST',
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  });
};

module.exports = {
  arLicenceAnalyis,
  arRefreshLicenceWebhook
};
