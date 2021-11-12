const controller = require('../controllers/charge-information-workflow');
const { VALID_GUID } = require('shared/lib/validators');
const { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const preHandlers = require('../pre-handlers');
const Joi = require('joi');
const allowedScopes = [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer];

module.exports = {
  getChargeInformationWorkflow: {
    method: 'GET',
    path: '/charge-information-workflow',
    handler: controller.getChargeInformationWorkflow,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'View for charge information workflow tabs in the internal UI',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        query: Joi.object().keys({
          toSetupPageNumber: Joi.number().integer().min(1).default(1),
          reviewPageNumber: Joi.number().integer().min(1).default(1),
          changeRequestPageNumber: Joi.number().integer().min(1).default(1)
        })
      },
      pre: [
        { method: preHandlers.loadChargeVersionWorkflows, assign: 'chargeInformationWorkflows' },
        { method: preHandlers.loadChargeVersionWorkflowsReview, assign: 'chargeInformationWorkflowsReview' },
        { method: preHandlers.loadChargeVersionWorkflowsChangeRequest, assign: 'chargeInformationWorkflowsChangeRequest' }
      ]
    }
  },

  getRemoveChargeInformationWorkflow: {
    method: 'GET',
    path: '/charge-information-workflow/{chargeVersionWorkflowId}/remove',
    handler: controller.getRemoveChargeInformationWorkflow,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Confirmation page to remove charge information workflow',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          chargeVersionWorkflowId: VALID_GUID
        })
      },
      pre: [
        { method: preHandlers.loadChargeVersionWorkflow, assign: 'chargeInformationWorkflow' }
      ]
    }
  },

  postRemoveChargeInformationWorkflow: {
    method: 'POST',
    path: '/charge-information-workflow/{chargeVersionWorkflowId}/remove',
    handler: controller.postRemoveChargeInformationWorkflow,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Post handler for remove charge information confirmation page',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          chargeVersionWorkflowId: VALID_GUID
        })
      }
    }
  }
};
