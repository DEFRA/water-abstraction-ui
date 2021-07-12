const controllers = require('./controllers');
const Joi = require('joi');
const constants = require('../../lib/constants');
const { billing } = constants.scope;

module.exports = {
  getChargingForecastReportsPage: {
    method: 'GET',
    path: '/reporting/charging-forecast-reports',
    handler: controllers.getChargingForecastReportsPage,
    config: {
      auth: { scope: billing },
      description: 'Retrieve a signed URL for a specific ',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Download a charging forecast report'
        }
      }
    }
  },
  getDownloadableReport: {
    method: 'GET',
    path: '/reporting/download/{reportIdentifier}',
    handler: controllers.getDownloadableReport,
    config: {
      auth: { scope: billing },
      description: 'Download a specific report',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      validate: {
        params: {
          reportIdentifier: Joi.string().valid(
            'billedActiveLicencesReport',
            'uncreditedInactiveLicencesReport',
            'unbilledActiveLicencesReport'
          ).required()
        }
      }
    }
  }
};
