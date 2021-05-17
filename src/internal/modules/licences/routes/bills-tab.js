'use strict';

const Joi = require('@hapi/joi');
const controller = require('../controllers/bills-tab');
const { scope } = require('../../../lib/constants');
const preHandlers = require('shared/lib/pre-handlers/licences');

const allowedScopes = [scope.billing];

module.exports = {
  getBillsForLicence: {
    method: 'GET',
    path: '/licences/{licenceId}/bills',
    handler: controller.getBillsForLicence,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Displays a list of bills for a particular licence',
      validate: {
        params: {
          licenceId: Joi.string().guid().required()
        },
        query: {
          page: Joi.number().default(1)
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      pre: [{
        method: preHandlers.loadLicenceDocument, assign: 'document'
      }]
    }
  }
};
