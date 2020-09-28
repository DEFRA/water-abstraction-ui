'use strict';

const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');

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

  getSelectAgreementType: {
    method: 'GET',
    path: '/licences/{licenceId}/agreements/select-type',
    handler: controller.getSelectAgreementType,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Select financial agreement type',
      validate: {
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getFlowState, assign: 'flowState' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadLicenceDocument, assign: 'document' }
      ]
    }
  },

  postSelectAgreementType: {
    method: 'POST',
    path: '/licences/{licenceId}/agreements/select-type',
    handler: controller.postSelectAgreementType,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Post handler for select financial agreement type',
      validate: {
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getFlowState, assign: 'flowState' },
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadLicenceDocument, assign: 'document' }
      ]
    }
  },

  getDateSigned: {
    method: 'GET',
    path: '/licences/{licenceId}/agreements/date-signed',
    handler: controller.getDateSigned,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Set the date the agreement was signed',
      validate: {
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getFlowState, assign: 'flowState' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  postDateSigned: {
    method: 'POST',
    path: '/licences/{licenceId}/agreements/date-signed',
    handler: controller.postDateSigned,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Set the date the agreement was signed',
      validate: {
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getFlowState, assign: 'flowState' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  getCheckStartDate: {
    method: 'GET',
    path: '/licences/{licenceId}/agreements/check-start-date',
    handler: controller.getCheckStartDate,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Check the start date for the agreement',
      validate: {
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  postCheckStartDate: {
    method: 'POST',
    path: '/licences/{licenceId}/agreements/check-start-date',
    handler: controller.postCheckStartDate,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Post handler to set the date the agreement was signed',
      validate: {
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  getCheckAnswers: {
    method: 'GET',
    path: '/licences/{licenceId}/agreements/check-answers',
    handler: controller.getCheckAnswers,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Check answers page',
      validate: {
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getFlowState, assign: 'flowState' },
        { method: preHandlers.loadLicence, assign: 'licence' }
      ]
    }
  },

  postCheckAnswers: {
    method: 'POST',
    path: '/licences/{licenceId}/agreements/check-answers',
    handler: controller.postCheckAnswers,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Post handler for check answers page',
      validate: {
        params: {
          licenceId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.getFlowState, assign: 'flowState' },
        { method: preHandlers.loadLicenceDocument, assign: 'document' }
      ]
    }
  }
};
