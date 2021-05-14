'use strict';

const Joi = require('@hapi/joi');
const controller = require('../controllers/licence-summary');
const preHandlers = require('shared/lib/pre-handlers/licences');

module.exports = {
  getLicenceSummary: {
    method: 'GET',
    path: '/licences/{licenceId}/new',
    handler: controller.getLicenceSummary,
    config: {
      description: 'Gets summary details about a particular licence',
      validate: {
        params: Joi.object({
          licenceId: Joi.string().guid().required()
        })
      },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      pre: [{
        method: preHandlers.loadLicence, assign: 'licence'
      }, {
        method: preHandlers.loadDefaultLicenceVersion, assign: 'licenceVersion'
      }, {
        method: preHandlers.loadLicenceDocument, assign: 'document'
      }, {
        method: preHandlers.loadChargeVersions, assign: 'chargeVersions'
      }, {
        method: preHandlers.loadChargeVersionWorkflows, assign: 'chargeVersionWorkflows'
      }, {
        method: preHandlers.loadBills, assign: 'bills'
      }, {
        method: preHandlers.loadAgreements, assign: 'agreements'
      }, {
        method: preHandlers.loadReturns, assign: 'returns'
      }, {
        method: preHandlers.loadNotifications, assign: 'notifications'
      }, {
        method: preHandlers.loadSummary, assign: 'summary'
      }]
    }
  }
};
