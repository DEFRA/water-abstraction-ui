'use strict';

const { VALID_GUID } = require('shared/lib/validators');

const controller = require('../controllers/paper-forms');
const preHandlers = require('../pre-handlers');
const eventPreHandlers = require('shared/lib/pre-handlers/events');
const constants = require('../../../lib/constants');
const { returns } = constants.scope;
const { createFormRoutes } = require('shared/lib/route-helpers');
const Joi = require('@hapi/joi');

const formRoutes = {
  enterLicenceNumber: {
    path: '/returns-notifications/forms',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Enter a licence number'
        }
      },
      validate: {
        query: {
          licencesWithNoReturns: Joi.array().items(Joi.any()).optional(),
          form: Joi.string().optional()
        }
      }
    }
  },

  checkAnswers: {
    path: '/returns-notifications/check-answers',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Check returns details'
        }
      },
      pre: [
        { method: preHandlers.getStateFromSession, assign: 'state' }
      ]
    }
  },

  selectReturns: {
    path: '/returns-notifications/{documentId}/select-returns',
    config: {
      auth: {
        scope: returns
      },
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getDocumentFromSession, assign: 'document' }
      ],
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Which returns need a form?'
        }
      }
    }
  },

  selectAddress: {
    path: '/returns-notifications/{documentId}/select-address',
    config: {
      auth: {
        scope: returns
      },
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getDocumentFromSession, assign: 'document' }
      ],
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Select where to send the form'
        }
      }
    }
  },

  recipient: {
    path: '/returns-notifications/{documentId}/recipient',
    config: {
      auth: {
        scope: returns
      },
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getDocumentFromSession, assign: 'document' }
      ],
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Who should receive the form?'
        }
      }
    }
  },

  selectLicenceHolders: {
    path: '/returns-notifications/select-licence-holders',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Which licence holders need a form?'
        }
      },
      pre: [
        { method: preHandlers.getStateFromSession, assign: 'state' }
      ]
    }
  }

};

module.exports = {

  ...createFormRoutes(controller, formRoutes),

  getAcceptOneTimeAddress: {
    method: 'GET',
    path: '/returns-notifications/{documentId}/accept-one-time-address',
    config: {
      auth: {
        scope: returns
      },
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getDocumentFromSession, assign: 'document' }
      ]
    },
    handler: controller.getAcceptOneTimeAddress
  },

  getSend: {
    method: 'GET',
    path: '/returns-notifications/{eventId}/send',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      pre: [
        { method: eventPreHandlers.loadEvent, assign: 'event' }
      ]
    },
    handler: controller.getSend
  }
};
