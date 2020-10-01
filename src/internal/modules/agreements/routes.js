'use strict';

const controller = require('./controller');
const preHandlers = require('./pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');

const { deleteAgreements } = require('internal/lib/constants').scope;
const allowedScopes = [deleteAgreements];

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
