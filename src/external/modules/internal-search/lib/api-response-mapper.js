const { mapReturns } = require('../../returns/lib/helpers');

/**
 * Maps the response from the water service internal search API to a form
 * that is expected by the view
 * @param  {Object} response - response from API call
 * @param  {Object} request  - HAPI request instance
 * @return {Object}          - view data
 */
const mapResponseToView = (response, request) => {
  const { documents, returns, users } = response;
  const noResults = !(documents || returns || users);

  return {
    ...response,
    noResults,
    returns: returns ? mapReturns(returns, request) : null
  };
};

module.exports = {
  mapResponseToView
};
