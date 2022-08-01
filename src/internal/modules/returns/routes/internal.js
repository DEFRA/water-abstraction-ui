'use strict'

const Joi = require('joi')
const controller = require('../controllers/internal')
const constants = require('../../../lib/constants')
const returns = constants.scope.returns
const { VALID_GUID } = require('shared/lib/validators')
const licencePreHandlers = require('shared/lib/pre-handlers/licences')

const pre = [{
  method: licencePreHandlers.getLicenceByReturnId,
  assign: 'licence'
}]

module.exports = {

  getInternalRouting: {
    method: 'GET',
    path: '/return/internal',
    handler: controller.getInternalRouting,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form to route internal user to return flows',
      validate: {
        query: Joi.object().keys({
          returnId: Joi.string().required()
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - what do you want to do with this return?',
          activeNavLink: 'view',
          showMeta: true
        }
      },
      pre
    }
  },

  postInternalRouting: {
    method: 'POST',
    path: '/return/internal',
    handler: controller.postInternalRouting,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form handler for internal routing',
      validate: {
        query: Joi.object().keys({
          returnId: Joi.string().required()
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - what do you want to do with this return?',
          activeNavLink: 'view',
          showMeta: true
        },
        formValidator: {
          payload: {
            csrf_token: VALID_GUID
          }
        }
      },
      pre
    }
  },

  getLogReceipt: {
    method: 'GET',
    path: '/return/log-receipt',
    handler: controller.getLogReceipt,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form to log return as received',
      validate: {
        query: Joi.object().keys({
          returnId: Joi.string().required()
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'view',
          showMeta: false
        }
      }
    }
  },

  postLogReceipt: {
    method: 'POST',
    path: '/return/log-receipt',
    handler: controller.postLogReceipt,
    options: {
      auth: {
        scope: returns
      },
      description: 'POST handler - logs return as received',
      validate: {
        query: Joi.object().keys({
          returnId: Joi.string().required()
        }),
        payload: Joi.object().keys({
          'dateReceived-day': Joi.string().allow(''),
          'dateReceived-month': Joi.string().allow(''),
          'dateReceived-year': Joi.string().allow(''),
          csrf_token: Joi.string().guid(),
          isUnderQuery: Joi.string().valid('', 'under_query')
        })

      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'view',
          showMeta: false
        }
      }
    }
  },

  getReceiptLogged: {
    method: 'GET',
    path: '/return/receipt-logged',
    handler: controller.getReceiptLogged,
    options: {
      auth: {
        scope: returns
      },
      description: 'Success page for log receipt of return flow',
      validate: {
        query: Joi.object().keys({
          returnId: Joi.string().required()
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return received',
          activeNavLink: 'view',
          showMeta: false
        }
      }
    }
  },

  getQueryLogged: {
    method: 'GET',
    path: '/return/query-logged',
    handler: controller.getQueryLogged,
    options: {
      auth: {
        scope: returns
      },
      description: 'Success page for set/clear under query flag',
      validate: {
        query: Joi.object().keys({
          returnId: Joi.string().required()
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return query received',
          activeNavLink: 'view',
          showMeta: false
        }
      }
    }
  }
}
