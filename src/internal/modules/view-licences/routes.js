const controller = require('./controller');
const { VALID_GUID } = require('shared/lib/validators');
const constants = require('../../lib/constants');
const allAdmin = constants.scope.allAdmin;

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
          communications: true
        }
      }
    },
    auth: { scope: allAdmin }
  }
};

exports.getExpiredLicence = getExpiredLicence;
