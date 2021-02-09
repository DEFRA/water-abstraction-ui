const Joi = require('@hapi/joi');
const constants = require('../../../lib/constants');
const allowedScopes = [constants.scope.returns];
const controller = require('../controllers/delete');

module.exports = [{
  method: 'GET',
  path: '/returns/delete-return',
  handler: controller.getDeleteReturn,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'Displays the check page for deleting a return',
    validate: {
      query: {
        id: Joi.string().required()
      }
    },
    plugins: {
      viewContext: {
        activeNavLink: 'returns',
        showMeta: true
      }
    }
  }
}, {
  method: 'POST',
  path: '/returns/delete-return',
  handler: controller.postDeleteReturn,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'Displays the check page for deleting a return',
    validate: {
      payload: {
        returnId: Joi.string().required(),
        csrf_token: Joi.string().guid()
      }
    },
    plugins: {
      viewContext: {
        activeNavLink: 'returns',
        showMeta: true
      }
    }
  }
}
];
