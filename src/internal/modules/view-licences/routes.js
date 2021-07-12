'use strict';

const Joi = require('joi');
const controller = require('./controller');
const { scope } = require('../../lib/constants');
const preHandlers = require('shared/lib/pre-handlers/licences');
const preHandlersGS = require('internal/modules/gauging-stations/lib/prehandlers');

module.exports = {

  getLicenceSummary: {
    method: 'GET',
    path: '/licences/{licenceId}',
    handler: controller.getLicenceSummary,
    config: {
      description: 'Gets summary details about a particular licence',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required()
        })
      },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      pre: [
        [
          {
            method: preHandlers.loadLicence, assign: 'licence'
          }
        ],
        [
          {
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
          }
        ],
        [
          {
            method: preHandlers.loadPrimaryUser, assign: 'primaryUser'
          },
          {
            method: preHandlers.loadSummary, assign: 'summary'
          }, {
            method: preHandlersGS.loadGaugingStationsByLicenceId, assign: 'gaugingStations'
          }

        ]
      ]
    }
  },

  getBillsForLicence: {
    method: 'GET',
    path: '/licences/{licenceId}/bills',
    handler: controller.getBillsForLicence,
    config: {
      auth: {
        scope: scope.billing
      },
      description: 'Displays a list of bills for a particular licence',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required()
        }),
        query: Joi.object().keys({
          page: Joi.number().default(1)
        })
      },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      pre: [{
        method: preHandlers.loadLicenceDocument, assign: 'document'
      }, {
        method: preHandlers.loadBills, assign: 'bills'
      }]
    }
  }
};
