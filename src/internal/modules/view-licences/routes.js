const controller = require('./controller');
const { VALID_GUID } = require('shared/lib/validators');

const getExpiredLicence = {
  method: 'GET',
  path: '/expired-licences/{documentId}',
  handler: controller.getExpiredLicence,
  config: {
    description: 'Shows expired licence details to internal users',
    validate: {
      params: {
        documentId: VALID_GUID
      }
    },
    plugins: {
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          licence: true,
          primaryUser: true,
          communications: true,
          chargeVersions: true
        }
      }
    }
  }
};

exports.getExpiredLicence = getExpiredLicence;
