'use strict';

const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const Joi = require('@hapi/joi');

const { deleteAgreements, manageAgreements } = require('internal/lib/constants').scope;

module.exports = {
  getDeleteAgreement: {
    method: 'GET',
    path: '/licences/{licenceId}/agreements/{agreementId}/delete',
    handler: controller.getDeleteAgreement,
    options: {
      auth: {
        scope: [deleteAgreements]
      },
      description: 'Warning page for deleting an agreement',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          licenceId: VALID_GUID,
          agreementId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadAgreement, assign: 'agreement' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadDocument, assign: 'document' }
      ]
    }
  },

  postDeleteAgreement: {
    method: 'POST',
    path: '/licences/{licenceId}/agreements/{agreementId}/delete',
    handler: controller.postDeleteAgreement,
    options: {
      auth: {
        scope: [deleteAgreements]
      },
      description: 'Post handler for deleting an agreement',
      validate: {
        params: {
          licenceId: VALID_GUID,
          agreementId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadDocument, assign: 'document' }
      ]
    }
  },

  getEndAgreement: {
    method: 'GET',
    path: '/licences/{licenceId}/agreements/{agreementId}/end',
    handler: controller.getEndAgreement,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Page for setting an agreement end date',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          licenceId: VALID_GUID,
          agreementId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadAgreement, assign: 'agreement' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadDocument, assign: 'document' }
      ]
    }
  },

  postEndAgreement: {
    method: 'POST',
    path: '/licences/{licenceId}/agreements/{agreementId}/end',
    handler: controller.postEndAgreement,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Route that handles the POST to set an agreement end date in the session',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          licenceId: VALID_GUID,
          agreementId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadAgreement, assign: 'agreement' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadDocument, assign: 'document' }
      ]
    }
  },








  getConfirmEndAgreement: {
    method: 'GET',
    path: '/licences/{licenceId}/agreements/{agreementId}/end/confirm',
    handler: controller.getConfirmEndAgreement,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Page for confirming ending an agreement',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          licenceId: VALID_GUID,
          agreementId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadAgreement, assign: 'agreement' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadDocument, assign: 'document' }
      ]
    }
  },

  postConfirmEndAgreement: {
    method: 'POST',
    path: '/licences/{licenceId}/agreements/{agreementId}/end/confirm',
    handler: controller.postConfirmEndAgreement,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Route that handles the POST to end an agreement',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          licenceId: VALID_GUID,
          agreementId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadAgreement, assign: 'agreement' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadDocument, assign: 'document' }
      ]
    }
  }
};
const config = require('../../config');

if (config.featureToggles.manageAgreements) {
  module.exports = {
    getDeleteAgreement: {
      method: 'GET',
      path: '/licences/{licenceId}/agreements/{agreementId}/delete',
      handler: controller.getDeleteAgreement,
      options: {
        auth: {
          scope: allowedScopes
        },
        description: 'Warning page for deleting an agreement',
        plugins: {
          viewContext: {
            activeNavLink: 'view'
          }
        },
        validate: {
          params: {
            licenceId: VALID_GUID,
            agreementId: VALID_GUID
          }
        },
        pre: [
          { method: preHandlers.loadAgreement, assign: 'agreement' },
          { method: preHandlers.loadLicence, assign: 'licence' },
          { method: preHandlers.loadDocument, assign: 'document' }
        ]
      }
    },

    postDeleteAgreement: {
      method: 'POST',
      path: '/licences/{licenceId}/agreements/{agreementId}/delete',
      handler: controller.postDeleteAgreement,
      options: {
        auth: {
          scope: allowedScopes
        },
        description: 'Post handler for deleting an agreement',
        validate: {
          params: {
            licenceId: VALID_GUID,
            agreementId: VALID_GUID
          }
        },
        pre: [
          { method: preHandlers.loadDocument, assign: 'document' }
        ]
      }
    }
  };
}
