const Joi = require('joi');
const controller = require('../controllers/log-receipt');
const constants = require('../../../lib/constants');
const returns = constants.scope.returns;

module.exports = {
  getLogReceipt: {
    method: 'GET',
    path: '/admin/return/log-receipt',
    handler: controller.getLogReceipt,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form to log return as received',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'returns',
          showMeta: false
        }
      }
    }
  },

  postLogReceipt: {
    method: 'POST',
    path: '/admin/return/log-receipt',
    handler: controller.postLogReceipt,
    options: {
      auth: {
        scope: returns
      },
      description: 'POST handler - logs return as received',
      validate: {
        query: {
          returnId: Joi.string().required()
        },
        payload: {
          'date_received-day': Joi.string().allow(''),
          'date_received-month': Joi.string().allow(''),
          'date_received-year': Joi.string().allow(''),
          csrf_token: Joi.string().guid()
        }

      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'returns',
          showMeta: false
        }
      }
    }
  },

  getReceiptLogged: {
    method: 'GET',
    path: '/admin/return/receipt-logged',
    handler: controller.getReceiptLogged,
    options: {
      auth: {
        scope: returns
      },
      description: 'Success page for log receipt of return flow',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return received',
          activeNavLink: 'returns',
          showMeta: false
        }
      }
    }
  }
};
