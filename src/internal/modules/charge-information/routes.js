const Joi = require('@hapi/joi');

const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');

const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

module.exports = {
  getTasklist: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/task-list',
    handler: controller.getTasklist,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Shows tasklist for new charge information',
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
  getReason: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/reason',
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
        { method: preHandlers.loadChangeReasons, assign: 'changeReasons' }
      ]
    }
  },
  postReason: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/reason',
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
        },
        payload: {
          csrf_token: VALID_GUID,
          reason: VALID_GUID.optional()
        }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadChangeReasons, assign: 'changeReasons' }
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
        // payload: {
        //   csrf_token: VALID_GUID
        //   // startDate: Joi.string().optional(),
        //   // 'customDate-day': Joi.string().optional(),
        //   // 'customDate-month': Joi.string().optional(),
        //   // 'customDate-year': Joi.string().optional()
        // }
      },
      pre: [
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  }
};
