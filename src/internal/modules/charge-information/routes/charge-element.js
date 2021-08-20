const controller = require('../controllers/charge-element');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const Joi = require('joi');
const { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const allowedScopes = [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer];
const { ROUTING_CONFIG } = require('../lib/charge-elements/constants');
const chargeElementSteps = Object.keys(ROUTING_CONFIG);

module.exports = {
  getChargeElementStep: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/charge-element/{elementId}/{step}',
    handler: controller.getChargeElementStep,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Single GET route for all charge element properties',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID,
          step: Joi.string().valid(...chargeElementSteps).required(),
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
        { method: preHandlers.loadDefaultCharges, assign: 'defaultCharges' },
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' }
      ]
    }
  },
  postChargeElementStep: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/charge-element/{elementId}/{step}',
    handler: controller.postChargeElementStep,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Single POST route for all charge element properties',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID,
          step: Joi.string().valid(...chargeElementSteps).required(),
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
        { method: preHandlers.loadDefaultCharges, assign: 'defaultCharges' },
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' }
      ]
    }
  }
};
