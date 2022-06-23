const services = require('../../lib/connectors/services')

/**
 * Loads the Charging Reports page
 * @param request {Object} The request object
 * @param h {Object} The response object
 * @returns {Object} h.view Object containing page details
 */
const getChargingForecastReportsPage = (request, h) => {
  return h.view('nunjucks/reporting/charging-forecast-reports', {
    ...request.view,
    back: '/manage',
    pageTitle: 'Download a charging forecast report'
  })
}

/**
 * Loads a specific report by making a request to the backend
 * @param request {Object} The request object
 * @param h {Object} The response object
 * @returns {Object} h.response Response body
 */
const getDownloadableReport = async (request, h) => {
  const { reportIdentifier } = request.params
  const { userId } = request.defra
  // get signed url
  const report = await services.water.reporting.getReport(userId, reportIdentifier)

  return h.response(report)
    .header('Content-type', 'text/csv')
    .header('Content-disposition', `attachment; filename="${reportIdentifier}.csv"`)
}

exports.getChargingForecastReportsPage = getChargingForecastReportsPage
exports.getDownloadableReport = getDownloadableReport
