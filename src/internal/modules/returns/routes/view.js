const Joi = require('@hapi/joi');
const controller = require('../controllers/view');
const { scope } = require('../../../lib/constants');

const allowedScopes = [scope.licenceHolder, scope.colleague, scope.colleagueWithReturns];

module.exports = {
  getReturnsForLicence: {
    method: 'GET',
    path: '/licences/{documentId}/returns',
    handler: controller.getReturnsForLicence,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Displays a list of returns for a particular licence',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        },
        query: {
          page: Joi.number().default(1)
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      }
    }
  },

  getReturn: {
    method: 'GET',
    path: '/returns/return',
    handler: controller.getReturn,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Displays data for a single return',
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
  }
};
