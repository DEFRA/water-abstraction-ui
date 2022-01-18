const controller = require('../controllers/charge-information');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const Joi = require('joi');
const { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const allowedScopes = [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer];

module.exports = {
  getReason: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/create',
    handler: controller.getReason,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select reason for new charge version',
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
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadChargeableChangeReasons, assign: 'changeReasons' }
      ]
    }
  },

  postReason: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/create',
    handler: controller.postReason,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select reason for new charge version',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
          returnToCheckData: Joi.boolean().default(false),
          isChargeable: Joi.boolean().default(true),
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadChargeableChangeReasons, assign: 'changeReasons' }
      ]
    }
  },

  getStartDate: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/start-date',
    handler: controller.getStartDate,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select start date for new charge version',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
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

  postStartDate: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/start-date',
    handler: controller.postStartDate,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select start date for new charge version',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
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

  getBillingAccount: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/billing-account',
    handler: controller.getBillingAccount,
    options: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
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

  getHandleBillingAccount: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/set-billing-account',
    handler: controller.getHandleBillingAccount,
    options: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
          returnToCheckData: Joi.boolean().default(false),
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' }
      ]
    }
  },

  getUseAbstractionData: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/use-abstraction-data',
    handler: controller.getUseAbstractionData,
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
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
          form: VALID_GUID.optional(),
          invoiceAccountId: VALID_GUID.optional(),
          returnToCheckData: Joi.boolean().default(false),
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadChargeVersions, assign: 'chargeVersions' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  postUseAbstractionData: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/use-abstraction-data',
    handler: controller.postUseAbstractionData,
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
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
          returnToCheckData: Joi.boolean().default(false),
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadDefaultCharges, assign: 'defaultCharges' },
        { method: preHandlers.loadChargeVersions, assign: 'chargeVersions' }
      ]
    }
  },

  getCheckData: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/check',
    handler: controller.getCheckData,
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
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [

        { method: preHandlers.loadBillingAccount, assign: 'billingAccount' },
        { method: preHandlers.loadValidatedDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadIsChargeable, assign: 'isChargeable' }
      ]
    }
  },

  postCheckData: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/check',
    handler: controller.postCheckData,
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
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
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

  getCancelData: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/cancel',
    handler: controller.getCancelData,
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
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
          chargeVersionWorkflowId: Joi.string().uuid().optional().default('')
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  postCancelData: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/cancel',
    handler: controller.postCancelData,
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
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
          chargeVersionWorkflowId: Joi.string().uuid().optional()
        })
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  getSubmitted: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/submitted',
    handler: controller.getSubmitted,
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
        params: Joi.object().keys({
          licenceId: VALID_GUID
        }),
        query: Joi.object().keys({
          chargeable: Joi.boolean().default(false).optional()
        })
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  }
};
