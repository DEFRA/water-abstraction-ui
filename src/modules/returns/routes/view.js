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
        query: {
          page: Joi.number().default(1)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Your returns',
          activeNavLink: 'returns'
        },
        hapiRouteAcl: {
          permissions: ['returns:read']
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
        },
        hapiRouteAcl: {
          permissions: ['returns:read']
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
        hapiRouteAcl: {
          permissions: ['returns:read']
        },
        viewContext: {
          activeNavLink: 'returns',
          showMeta: true
        }
      }
    }
  }
};
