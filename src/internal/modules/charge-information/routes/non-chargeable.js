const controller = require('../controllers/non-chargeable');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const Joi = require('@hapi/joi');
const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

module.exports = {
  getNonChargeableReason: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/non-chargeable-reason',
    handler: controller.getNonChargeableReason,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select a non chargeable reason',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object({
          licenceId: VALID_GUID
        }),
        query: Joi.object({
          form: VALID_GUID.optional(),
          start: Joi.number().default(0).allow(0, 1),
          returnToCheckData: Joi.boolean().default(false),
          isChargeable: Joi.boolean().default(false),
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadNonChargeableChangeReasons, assign: 'changeReasons' }
      ]
    }
  },

  postNonChargeableReason: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/non-chargeable-reason',
    handler: controller.postNonChargeableReason,
    options: {
      auth: {
        scope: allowedScopes
      },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object({
          licenceId: VALID_GUID
        }),
        query: Joi.object({
          form: VALID_GUID.optional(),
          returnToCheckData: Joi.boolean().default(false),
          isChargeable: Joi.boolean().default(false),
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadNonChargeableChangeReasons, assign: 'changeReasons' }
      ]
    }
  },

  getEffectiveDate: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/effective-date',
    handler: controller.getEffectiveDate,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select effective date for a non chargeable licence',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object({
          licenceId: VALID_GUID
        }),
        query: Joi.object({
          form: VALID_GUID.optional(),
          returnToCheckData: Joi.boolean().default(false),
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadIsChargeable, assign: 'isChargeable' }

      ]
    }
  },

  postEffectiveDate: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/effective-date',
    handler: controller.postEffectiveDate,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select effective date for a non chargeable licence',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object({
          licenceId: VALID_GUID
        }),
        query: Joi.object({
          returnToCheckData: Joi.boolean().default(false),
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
