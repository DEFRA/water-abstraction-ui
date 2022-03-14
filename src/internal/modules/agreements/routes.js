'use strict';
const Joi = require('joi');
const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const sharedPreHandlers = require('shared/lib/pre-handlers/licences');
const { VALID_GUID } = require('shared/lib/validators');

const config = require('../../config');
const { deleteAgreements, manageAgreements } = require('internal/lib/constants').scope;

if (config.featureToggles.manageAgreements) {
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
          params: Joi.object().keys({
            licenceId: VALID_GUID,
            agreementId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.loadAgreement, assign: 'agreement' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID,
            agreementId: VALID_GUID
          })
        },
        pre: [
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.getFlowState, assign: 'flowState' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.getFlowState, assign: 'flowState' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.getFlowState, assign: 'flowState' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.getFlowState, assign: 'flowState' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID
          })
        },
        pre: [
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID
          })
        },
        pre: [
          { method: sharedPreHandlers.loadLicence, assign: 'licence' },
          { method: sharedPreHandlers.loadChargeVersions, assign: 'chargeVersions' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.getFlowState, assign: 'flowState' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.getFlowState, assign: 'flowState' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID,
            agreementId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.loadAgreement, assign: 'agreement' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID,
            agreementId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.loadAgreement, assign: 'agreement' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' },
          { method: sharedPreHandlers.loadChargeVersions, assign: 'chargeVersions' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID,
            agreementId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.loadAgreement, assign: 'agreement' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
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
          params: Joi.object().keys({
            licenceId: VALID_GUID,
            agreementId: VALID_GUID
          })
        },
        pre: [
          { method: preHandlers.loadAgreement, assign: 'agreement' },
          { method: sharedPreHandlers.loadLicence, assign: 'licence' }
        ]
      }
    }
  };
}
;
