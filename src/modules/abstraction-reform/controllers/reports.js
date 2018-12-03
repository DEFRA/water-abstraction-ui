const { getCSVData, getReportFilename } = require('../lib/report-helpers.js');

/**
 * A page to allow the downloading of the AR CSV report
 * @param {String} request.query.download - if present, initiates download of CSV report
 */
const getCSVReport = async (request, h) => {
  const { view } = request;
  const { download } = request.query;

  if (download) {
    const csv = await getCSVData();
    const filename = getReportFilename();
    return h.response(csv)
      .header('Content-type', 'text/csv')
      .header('Content-disposition', `attachment; filename=${filename}`);
  }

  return h.view('water/abstraction-reform/csv-report', view);
};

module.exports = {
  getCSVReport
};
