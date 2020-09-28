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

  getEndAgreement: {
    method: 'GET',
    path: '/licences/{licenceId}/agreements/{agreementId}/end',
    handler: controller.getEndAgreement,
    options: {
      auth: {
        scope: [manageAgreements]
      },
      description: 'Page for ending an agreement',
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
};
