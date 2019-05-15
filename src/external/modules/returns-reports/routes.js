const Joi = require('joi');
const controller = require('./controller');
const constants = require('../../lib/constants');
const returns = constants.scope.returns;

module.exports = {

  getNotificationsList: {
    method: 'GET',
    path: '/admin/returns-reports',
    handler: controller.getReturns,
    config: {
      auth: { scope: returns },
      description: 'View overview of all returns cycles',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Returns overview'
        }
      }
    }
  },

  getDownload: {
    method: 'GET',
    path: '/admin/returns-reports/download/{cycleEndDate}',
    handler: controller.getDownloadReport,
    config: {
      auth: { scope: returns },
      description: 'Download CSV report of specified return cycle',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Returns overview'
        }
      },
      validate: {
        params: {
          cycleEndDate: Joi.string().isoDate().options({ convert: false })
        }
      }
    }
  }

};
