const getChargingForecastReportsPage = (request, h) => {
  return h.view('nunjucks/reporting/charging-forecast-reports', {
    ...request.view,
    back: '/manage',
    pageTitle: 'Download a charging forecast report'
  });
};

const getDownloadableReport = (request, h) => {
  const { reportIdentifier } = request.params;
  return h.view('nunjucks/reporting/downloading', {
    ...request.view,
    back: '/reporting/charging-forecast-reports',
    pageTitle: 'Download a charging forecast report',
    signedUrl: 'https://people.sc.fsu.edu/~jburkardt/data/csv/addresses.csv'
  });
};

exports.getChargingForecastReportsPage = getChargingForecastReportsPage;
exports.getDownloadableReport = getDownloadableReport;
