const controller = require('./controller');
const { VALID_GUID } = require('shared/lib/validators');

const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

module.exports = {
  getChargeVersion: {
    method: 'GET',
    path: '/licences/{documentId}/charge-version/{chargeVersionId}',
    handler: controller.getChargeVersion,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Shows a charge version with elements and agreements',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        },
        licenceData: {
          load: {
            licence: true
          }
        }
      },
      validate: {
        params: {
          documentId: VALID_GUID,
          chargeVersionId: VALID_GUID
        }
      }
    }
  }
};
