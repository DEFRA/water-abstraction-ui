const { scope } = require('../../../lib/constants');
const controller = require('../controllers/upload');

const validators = require('../../../lib/validators');

const allowedScopes = [scope.licenceHolder, scope.colleagueWithReturns];

module.exports = {
  getSummary: {
    method: 'GET',
    path: '/returns/upload-summary/{eventId}',
    handler: controller.getSummary,
    config: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: {
          eventId: validators.VALID_GUID
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  },
  getSummaryReturn: {
    method: 'GET',
    path: '/returns/upload-summary/{eventId}/{returnId*}',
    handler: controller.getSummaryReturn,
    config: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: {
          eventId: validators.VALID_GUID,
          returnId: validators.VALID_RETURN_ID
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  }
};
