const controller = require('../controllers/view-charge-information');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

module.exports = {
  getViewChargeInformation: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/{chargeVersionId}/view',
    handler: controller.getViewChargeInformation,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Displays charge version information',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          licenceId: VALID_GUID,
          chargeVersionId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadChargeVersion, assign: 'chargeVersion' }
      ]
    }
  },

  getReviewChargeInformation: {
    method: 'GET',
    path: '/licences/{licenceId}/charge-information/{chargeVersionWorkflowId}/review',
    handler: controller.getReviewChargeInformation,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Displays charge version information for review',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: {
          licenceId: VALID_GUID,
          chargeVersionWorkflowId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadLicence, assign: 'licence' },
        { method: preHandlers.loadChargeVersionWorkflow, assign: 'draftChargeInformation' },
        { method: preHandlers.loadIsChargeable, assign: 'isChargeable' }
      ]
    }
  }
};
