const controller = require('../controllers/charge-information-workflow');
const { VALID_GUID } = require('shared/lib/validators');
const { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const preHandlers = require('../pre-handlers');
const Joi = require('@hapi/joi');
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
      pre: [
        { method: preHandlers.loadChargeVersionWorkflows, assign: 'chargeInformationWorkflows' }
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
        params: Joi.object({
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
        params: Joi.object({
          chargeVersionWorkflowId: VALID_GUID
        })
      }
    }
  }
};
