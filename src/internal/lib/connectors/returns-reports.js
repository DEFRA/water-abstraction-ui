// List of available reports
const reports = {
  userDetails: 'user-details',
  statuses: 'return-statuses',
  licenceCount: 'licence-count',
  frequencies: 'returns-frequencies'
};

/**
 * Gets rp options object to make a request for a report from the returns
 * service
 * @param  {String} reportName  - the report to load
 * @param  {Object} [filter={}] - filter to select reports
 * @return {Object}             - rp options
 */
const getReportRequestOptions = (reportName, filter = {}) => {
  const filterStr = JSON.stringify({
    ...filter,
    regime: 'water',
    licence_type: 'abstraction'
  });

  return {
    uri: `${process.env.RETURNS_URI}/reports/${reports[reportName]}`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    method: 'GET',
    qs: {
      filter: filterStr
    },
    json: true
  };
};

module.exports = {
  getReportRequestOptions
};
