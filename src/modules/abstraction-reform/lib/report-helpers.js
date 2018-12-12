const moment = require('moment');
const util = require('util');
const csvStringify = util.promisify(require('csv-stringify'));
const water = require('../../../lib/connectors/water');

/**
 * Gets CSV data from API in water service using findAll method which
 * gets all pages of paginated data
 * Returns as CSV string
 * @return {Promise} Resolves with CSV data
 */
const getCSVData = async () => {
  const sort = { start_date: 1 };
  const filter = {};
  const data = await water.arLicenceAnalyis.findAll(filter, sort);
  return csvStringify(data, { header: true });
};

/**
 * Gets filename for CSV report
 * @param  {String} [date] optional date in ISO 8601 format
 * @return {String} CSV report filename
 */
const getReportFilename = (date) => {
  return `${moment(date).format('YYYY-MM-DD')}-ar-report.csv`;
};
module.exports = {
  getCSVData,
  getReportFilename
};
