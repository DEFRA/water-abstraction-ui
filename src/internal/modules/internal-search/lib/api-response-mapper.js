'use strict';
const returnsMapper = require('../../../lib/mappers/returns');

/**
 * Maps the response from the water service internal search API to a form
 * that is expected by the view
 * @param  {Object} response - response from API call
 * @param  {Object} request  - HAPI request instance
 * @return {Object}          - view data
 */
const mapResponseToView = (response, request) => {
  const { documents, returns, users, gaugingStations, billingAccounts } = response;
  const noResults = !(documents || returns || users || gaugingStations || billingAccounts);

  return {
    ...response,
    noResults,
    returns: returns ? returnsMapper.mapReturns(returns, request) : null,
    billingAccounts: billingAccounts || null
  };
};

module.exports = {
  mapResponseToView
};
