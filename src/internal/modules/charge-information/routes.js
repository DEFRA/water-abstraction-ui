const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');

const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          form: VALID_GUID.optional()
        }
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
        params: {
          licenceId: VALID_GUID
        }
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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          form: VALID_GUID.optional()
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
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
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  getSelectBillingAccount: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/billing-account',
    handler: controller.getSelectBillingAccount,
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
          form: VALID_GUID.optional()
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadBillingAccounts, assign: 'billingAccounts' }
      ]
    }
  },

  postSelectBillingAccount: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/billing-account',
    handler: controller.postSelectBillingAccount,
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
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadBillingAccounts, assign: 'billingAccounts' }
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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          form: VALID_GUID.optional()
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
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
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadDefaultCharges, assign: 'defaultCharges' }
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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          form: VALID_GUID.optional()
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
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
        params: {
          licenceId: VALID_GUID
        },
        query: {
          form: VALID_GUID.optional()
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  }
};
