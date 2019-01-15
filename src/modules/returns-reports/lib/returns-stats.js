const { difference } = require('lodash');
const { returns } = require('../../../lib/connectors/returns');

/**
 * In a row, one column will be 'count' while the other will
 * be
 * @param  {[type]} row [description]
 * @return {[type]}     [description]
 */
const getKeyAndValue = (row) => {
  // Find the key which is not 'count'
  const key = difference(Object.keys(row), ['count'])[0];
  return {
    key: row[key],
    value: row.count
  };
};

/**
 * Detects whether data returned from returns report is grouped row data
 * representing key/value pairs
 * @param  {Array}  data - data returned from returns report
 * @return {Boolean}      true if data is grouped
 */
const isGrouped = (data) => {
  const keys = Object.keys(data[0]);
  const hasCountColumn = keys.includes('count');
  const hasMultipleColumns = keys.length > 1;
  return hasCountColumn && hasMultipleColumns;
};

/**
* Detects whether data returned from returns report is a single value
* @param  {Array}  data - data returned from returns report
* @return {Boolean}      true if data is single value
 */
const isSingleValue = (data) => {
  const keys = Object.keys(data[0]);
  return data.length === 1 && keys.length === 1 && keys[0] === 'count';
};

/**
 * Maps response from returns report API call
 * This is in the form { error, data }
 * If error is present, an error is thrown
 * Otherwise if grouped data is detected, it is reduced to a compact form,
 * e.g. { week :123, month : 456, year : 789 }
 * Otherwise, data is returned directly
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */
const mapReportResponse = (response) => {
  const { data, error } = response;
  if (error) {
    const err = new Error(`Error retrieving returns report`);
    err.params = { response };
    throw err;
  }
  if (isSingleValue(data)) {
    return data[0].count;
  }
  if (isGrouped(data)) {
    return data.reduce((acc, row) => {
      const { key, value } = getKeyAndValue(row);
      return {
        ...acc,
        [key]: value
      };
    }, {});
  }
  return response.data;
};

/**
 * Gets returns stats for the return cycle with the given end date
 * @param  {String}  endDate - e.g. 2019-03-31
 * @return {Promise}         resolves with report data
 */
const getReturnStats = async (endDate) => {
  const filter = { end_date: endDate };
  const data = {};
  for (let reportType of ['statuses', 'licenceCount', 'frequencies']) {
    const response = await returns.getReport(reportType, filter);
    data[reportType] = mapReportResponse(response);
  }
  return data;
};

module.exports = {
  getKeyAndValue,
  isGrouped,
  isSingleValue,
  mapReportResponse,
  getReturnStats
};
