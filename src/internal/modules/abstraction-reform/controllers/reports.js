const { getCSVData, getReportFilename } = require('../lib/report-helpers');
const { csvDownload } = require('../../../lib/csv-download');

/**
 * A page to allow the downloading of the AR CSV report
 * @param {String} request.query.download - if present, initiates download of CSV report
 */
const getCSVReport = async (request, h) => {
  const { view } = request;
  const { download } = request.query;

  if (download) {
    const data = await getCSVData();
    return csvDownload(h, data, getReportFilename());
  }

  return h.view('water/abstraction-reform/csv-report', view);
};

module.exports = {
  getCSVReport
};
