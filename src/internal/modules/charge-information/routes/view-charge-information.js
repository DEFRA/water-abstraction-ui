const controller = require('../controllers/view-charge-information');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const { chargeVersionWorkflowReviewer, viewChargeVersions } = require('internal/lib/constants').scope;
const Joi = require('joi');

const allowedScopes = {
  view: viewChargeVersions,
  approve: chargeVersionWorkflowReviewer
};

module.exports = {
  getViewChargeInformation: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/{chargeVersionId}/view',
    handler: controller.getViewChargeInformation,
    options: {
      auth: {
        scope: allowedScopes.view
      },
      description: 'Displays charge version information',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID,
          chargeVersionId: VALID_GUID
        })
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadChargeVersion, assign: 'chargeVersion' },
        { method: preHandlers.loadBillingAccountByChargeVersion, assign: 'billingAccount' }
      ]
    }
  },

  getReviewChargeInformation: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/{chargeVersionWorkflowId}/review',
    handler: controller.getReviewChargeInformation,
    options: {
      auth: {
        scope: allowedScopes.approve
      },
      description: 'Displays charge version information for review',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID,
          chargeVersionWorkflowId: VALID_GUID
        }),
        query:
          Joi.object().keys({
            form: VALID_GUID.optional(),
            returnToCheckData: Joi.boolean().default(false)
          })
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadIsChargeable, assign: 'isChargeable' },
        { method: preHandlers.loadBillingAccount, assign: 'billingAccount' }
      ]
    }
  },

  postReviewChargeInformation: {
    method: 'POST',
    path: '/licences/{licenceId}/charge-information/{chargeVersionWorkflowId}/review',
    handler: controller.postReviewChargeInformation,
    options: {
      auth: {
        scope: allowedScopes.approve
      },
      description: 'Handles the charge version information review',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID,
          chargeVersionWorkflowId: VALID_GUID
        })
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadDraftChargeInformation, assign: 'draftChargeInformation' },
        { method: preHandlers.loadIsChargeable, assign: 'isChargeable' },
        { method: preHandlers.loadBillingAccount, assign: 'billingAccount' }
      ]
    }
  }
};
