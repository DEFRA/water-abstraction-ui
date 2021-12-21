const controller = require('../controllers/charge-category');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const Joi = require('joi');
const { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const allowedScopes = [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer];
const { ROUTING_CONFIG } = require('../lib/charge-categories/constants');
const chargeCategorySteps = Object.keys(ROUTING_CONFIG);
const config = require('../../../config');

if (config.featureToggles.srocChargeInformation) {
  module.exports = {
    getChargeCategoryStep: {
      method: 'GET',
      path: '/licences/{licenceId}/charge-information/charge-category/{elementId}/{step}',
      handler: controller.getChargeCategoryStep,
      options: {
        auth: {
          scope: allowedScopes
        },
        description: 'Single GET route for all charge category properties',
        plugins: {
          viewContext: {
            activeNavLink: 'view'
          }
        },
        validate: {
          params: Joi.object().keys({
            licenceId: VALID_GUID,
            step: Joi.string().valid(...chargeCategorySteps).required(),
            elementId: VALID_GUID
          }),
          query: Joi.object().keys({
            form: VALID_GUID.optional(),
            returnToCheckData: Joi.boolean().default(false),
            chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
          })
        },
        pre: [
          { method: preHandlers.loadLicence, assign: 'licence' },
          { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' }
        ]
      }
    },
    postChargeCategoryStep: {
      method: 'POST',
      path: '/licences/{licenceId}/charge-information/charge-category/{elementId}/{step}',
      handler: controller.postChargeCategoryStep,
      options: {
        auth: {
          scope: allowedScopes
        },
        description: 'Single POST route for all charge category properties',
        plugins: {
          viewContext: {
            activeNavLink: 'view'
          }
        },
        validate: {
          params: Joi.object().keys({
            licenceId: VALID_GUID,
            step: Joi.string().valid(...chargeCategorySteps).required(),
            elementId: VALID_GUID
          }),
          query: Joi.object().keys({
            form: VALID_GUID.optional(),
            returnToCheckData: Joi.boolean().default(false),
            chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
          })
        },
        pre: [
          { method: preHandlers.loadLicence, assign: 'licence' },
          { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' }
        ]
      }
    }
  };
}
