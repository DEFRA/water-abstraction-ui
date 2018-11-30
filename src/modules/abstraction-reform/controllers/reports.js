const Boom = require('boom');
const util = require('util');
const moment = require('moment');
const csvStringify = util.promisify(require('csv-stringify'));
const { arLicenceAnalyis } = require('../../../lib/connectors/water');

/**
 * Gets the CSV data to use in the report
 * @return {Promise} resolves with abstraction reform licence data
 */
const getCsvData = async () => {
  const pagination = { page: 1, perPage: 10000 };
  const sort = { start_date: 1 };
  const { error, data } = await arLicenceAnalyis.findMany({}, sort, pagination);
  if (error) {
    throw Boom.badImplementation('arLicenceAnalyis API error', error);
  }
  return data;
};

/**
 * A page to allow the downloading of the AR CSV report
 */
const getCSVReport = async (request, h) => {
  const { view } = request;
  const { download } = request.query;

  if (download) {
    const data = await getCsvData();
    const csv = await csvStringify(data, { header: true });
    const filename = `${moment().format('YYYY-MM-DD')}-ar-report.csv`;
    return h.response(csv)
      .header('Content-type', 'text/csv')
      .header('Content-disposition', `attachment; filename=${filename}`);
  }

  return h.view('water/abstraction-reform/csv-report', view);
};

module.exports = {
  getCSVReport
};
