const SharedReturnsApiClient = require('shared/lib/connectors/services/returns/ReturnsApiClient');
const urlJoin = require('url-join');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

// List of available reports
const reports = {
  userDetails: 'user-details',
  statuses: 'return-statuses',
  licenceCount: 'licence-count',
  frequencies: 'returns-frequencies'
};

/**
 * Gets service request options object to make a request
 * for a report from the returns service.
 * @param  {Object} [filter={}] - filter to select reports
 * @return {Object}             - rp options
 */
const getReportRequestOptions = (filter = {}) => {
  const filterStr = JSON.stringify({
    ...filter,
    regime: 'water',
    licence_type: 'abstraction'
  });

  return {
    qs: { filter: filterStr }
  };
};

class ReturnsApiClient extends SharedReturnsApiClient {
  /**
   * Gets the report with the specified name
   * @param  {String} reportName  - report name corresponding to API endpoint in returns service
   * @param  {Object} [filter={}] - filtering options for returns
   * @return {Promise}             resolves with response from HTTP call
   */
  getReport (reportName, filter = {}) {
    const url = urlJoin(this.config.serviceUrl, 'reports', reports[reportName]);

    const options = getReportRequestOptions(filter);
    return serviceRequest.get(url, options);
  };
};

module.exports = ReturnsApiClient;
