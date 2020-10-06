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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          form: VALID_GUID.optional(),
          start: Joi.boolean().optional(),
          returnToCheckData: Joi.number().default(0).allow(0, 1)
        }
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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          form: VALID_GUID.optional(),
          returnToCheckData: Joi.number().default(0).allow(0, 1)
        }
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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          form: VALID_GUID.optional(),
          returnToCheckData: Joi.number().default(0).allow(0, 1)
        }
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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          returnToCheckData: Joi.number().default(0).allow(0, 1)
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  getConfirm: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/confirm',
    handler: controller.getConfirm,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Confirmation page for the end of the charge information flow',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          licenceId: VALID_GUID
        },
        query: {
          chargeable: Joi.boolean().default(false).optional()
        }
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  }
};
