const controller = require('../controllers/charge-information-workflow-note');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const Joi = require('joi');
const { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const allowedScopes = [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer];

module.exports = {
  deleteNote: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/note/delete',
    handler: controller.deleteNote,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Get charge information note details',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query:
          Joi.object().keys({
            form: VALID_GUID.optional(),
            returnToCheckData: Joi.boolean().default(false),
            isChargeable: Joi.boolean().default(true),
            chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
          })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },
  getNote: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/note/{noteId?}',
    handler: controller.getNote,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Get charge information note details',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID,
          noteId: VALID_GUID.optional()
        }),
        query:
          Joi.object().keys({
            form: VALID_GUID.optional(),
            returnToCheckData: Joi.boolean().default(false),
            isChargeable: Joi.boolean().default(true),
            chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
          })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  }
};
