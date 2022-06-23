const Joi = require('joi')
const controller = require('./controller')
const constants = require('../../lib/constants')
const returns = constants.scope.returns

const activeNavLink = 'notifications'

module.exports = {

  getReturnCycles: {
    method: 'GET',
    path: '/returns-reports',
    handler: controller.getReturnCycles,
    config: {
      auth: { scope: returns },
      description: 'View overview of all returns cycles',
      plugins: {
        viewContext: {
          activeNavLink,
          pageTitle: 'Returns overview'
        }
      }
    }
  },

  getConfirmDownload: {
    method: 'GET',
    path: '/returns-reports/{returnCycleId}',
    handler: controller.getConfirmDownload,
    config: {
      auth: { scope: returns },
      description: 'Confirmation page to download return cycle report',
      plugins: {
        viewContext: {
          activeNavLink
        }
      },
      validate: {
        params: Joi.object().keys({
          returnCycleId: Joi.string().guid().required()
        })
      }
    }
  },

  getDownload: {
    method: 'GET',
    path: '/returns-reports/download/{returnCycleId}',
    handler: controller.getDownloadReport,
    config: {
      auth: { scope: returns },
      description: 'Download CSV report of specified return cycle',
      plugins: {
        viewContext: {
          activeNavLink
        }
      },
      validate: {
        params: Joi.object().keys({
          returnCycleId: Joi.string().guid().required()
        })
      }
    }
  }

}
