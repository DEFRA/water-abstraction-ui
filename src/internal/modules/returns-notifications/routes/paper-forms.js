'use strict';

const { VALID_GUID } = require('shared/lib/validators');

const controller = require('../controllers/paper-forms');
const preHandlers = require('../pre-handlers');
const constants = require('../../../lib/constants');
const { returns } = constants.scope;

module.exports = {
  getEnterLicenceNumber: {
    method: 'GET',
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
    },
    handler: controller.getEnterLicenceNumber
  },
  postEnterLicenceNumber: {
    method: 'POST',
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
    },
    handler: controller.postEnterLicenceNumber
  },
  getCheckAnswers: {
    method: 'GET',
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
      }
    },
    handler: controller.getCheckAnswers
  },
  getSelectReturns: {
    method: 'GET',
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
    },
    handler: controller.getSelectReturns
  },
  postSelectReturns: {
    method: 'POST',
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
    },
    handler: controller.postSelectReturns
  },

  getSelectAddress: {
    method: 'GET',
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
    },
    handler: controller.getSelectAddress
  },
  postSelectAddress: {
    method: 'POST',
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
    },
    handler: controller.postSelectAddress
  },

  getRecipient: {
    method: 'GET',
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
    },
    handler: controller.getRecipient
  },

  postRecipient: {
    method: 'POST',
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
    },
    handler: controller.postRecipient
  },

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
  }
};
