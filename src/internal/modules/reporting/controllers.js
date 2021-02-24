const { unescape } = require('lodash');
const services = require('../../lib/connectors/services');

const getChargingForecastReportsPage = (request, h) => {
  return h.view('nunjucks/reporting/charging-forecast-reports', {
    ...request.view,
    back: '/manage',
    pageTitle: 'Download a charging forecast report'
  });
};

const getDownloadableReport = async (request, h) => {
  const { reportIdentifier } = request.params;
  // get signed url
  const response = await services.water.reporting.getReportSignedUrl(reportIdentifier);
  return h.view('nunjucks/reporting/downloading', {
    ...request.view,
    back: '/reporting/charging-forecast-reports',
    pageTitle: 'Download a charging forecast report',
    signedUrl: unescape(response.data.url)
  });
};

exports.getChargingForecastReportsPage = getChargingForecastReportsPage;
exports.getDownloadableReport = getDownloadableReport;
