const Joi = require('joi');
const controller = require('../controllers/view');
const { scope } = require('../../../lib/constants');

const allowedScopes = [scope.licenceHolder, scope.colleague, scope.colleagueWithReturns];

module.exports = {
  getAllReturns: {
    method: 'GET',
    path: '/returns',
    handler: controller.getReturns,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Displays a list of returns for the current licence holder',
      validate: {
        query: Joi.object().keys({
          page: Joi.number().default(1)
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Your returns',
          activeNavLink: 'returns'
        }
      }
    }
  },

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
        params: Joi.object().keys({
          documentId: Joi.string().guid().required()
        }),
        query: Joi.object().keys({
          page: Joi.number().default(1)
        })
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
        query: Joi.object().keys({
          id: Joi.string().required()
        })
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
