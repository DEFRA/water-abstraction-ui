const controller = require('../controllers/charge-version');
const preHandlers = require('../pre-handlers');
const { VALID_GUID } = require('shared/lib/validators');
const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

module.exports = {
  getChargeVersionReview: {
    method: 'GET',
    path: '/charge-version/{chargeVersionId}/view',
    handler: controller.getViewChargeVersion,
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
          chargeVersionId: VALID_GUID
        }
      },
      pre: [
        { method: preHandlers.loadChargeVersion, assign: 'chargeVersion' }
      ]
    }
  }
};
