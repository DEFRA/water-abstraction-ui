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
  const stringifiedReport = await services.water.reporting.getReport(reportIdentifier);

  return h.response(stringifiedReport)
    .header('Content-type', 'text/csv')
    .header('Content-disposition', `attachment; filename="${reportIdentifier}.csv"`);
};

exports.getChargingForecastReportsPage = getChargingForecastReportsPage;
exports.getDownloadableReport = getDownloadableReport;
