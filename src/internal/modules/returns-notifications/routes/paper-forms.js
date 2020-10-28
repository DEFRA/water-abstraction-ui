'use strict';

const { VALID_GUID } = require('shared/lib/validators');

const controller = require('../controllers/paper-forms');
const preHandlers = require('../pre-handlers');
const eventPreHandlers = require('shared/lib/pre-handlers/events');
const constants = require('../../../lib/constants');
const { returns } = constants.scope;
const { createHandlerPair } = require('../lib/route-helpers');

module.exports = {

  ...createHandlerPair(controller, 'getEnterLicenceNumber', {
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
      }
    }
  }),

  ...createHandlerPair(controller, 'getCheckAnswers', {
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
  }),

  ...createHandlerPair(controller, 'getSelectReturns', {
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
  }),

  ...createHandlerPair(controller, 'getSelectAddress', {
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
  }),

  ...createHandlerPair(controller, 'getRecipient', {
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
  }),

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

  ...createHandlerPair(controller, 'getSelectLicenceHolders', {
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
  }),

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
