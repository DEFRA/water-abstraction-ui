const Joi = require('joi');
const controller = require('../controllers/edit');
const constants = require('../../../lib/constants');
const returns = constants.scope.returns;
const { VALID_GUID } = require('../../../lib/validators');

module.exports = {
  getAmounts: {
    method: 'GET',
    path: '/admin/return',
    handler: controller.getAmounts,
    config: {
      auth: {
        scope: returns
      },
      description: 'Form to start the return process for a return, asks if nil return',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - are there any abstraction amounts to report?',
          activeNavLink: 'returns'
        }
      }
    }
  },
  postAmounts: {
    method: 'POST',
    path: '/admin/return',
    handler: controller.postAmounts,
    config: {
      auth: {
        scope: returns
      },
      description: 'Form handler for nil returns',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - are there any abstraction amounts to report?',
          activeNavLink: 'returns'
        },
        formValidator: {
          payload: {
            csrf_token: VALID_GUID,
            isNil: Joi.string().required().valid('Yes', 'No')
          }
        }
      }
    }
  }
};
