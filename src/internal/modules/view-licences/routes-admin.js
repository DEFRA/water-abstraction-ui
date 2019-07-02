const externalRoutes = require('./routes');
const constants = require('../../lib/constants');
const allAdmin = constants.scope.allAdmin;
const { preInternalView } = require('./pre-handlers');
const controller = require('./controller');
const { VALID_GUID } = require('shared/lib/validators');

const getLicenceAdmin = {
  ...externalRoutes.getLicence,
  config: {
    ...externalRoutes.getLicence.config,
    pre: [
      { method: preInternalView }
    ],
    auth: {
      scope: allAdmin
    }
  },
  path: '/licences/{documentId}'
};

const getLicenceContactAdmin = {
  ...externalRoutes.getLicenceContact,
  config: {
    ...externalRoutes.getLicenceContact.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/licences/{documentId}/contact'
};

const getLicencePurposesAdmin = {
  ...externalRoutes.getLicencePurposes,
  config: {
    ...externalRoutes.getLicencePurposes.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/licences/{documentId}/purposes'
};

const getLicencePointsAdmin = {
  ...externalRoutes.getLicencePoints,
  config: {
    ...externalRoutes.getLicencePoints.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/licences/{documentId}/points'
};

const getLicenceConditionsAdmin = {
  ...externalRoutes.getLicenceConditions,
  config: {
    ...externalRoutes.getLicenceConditions.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/licences/{documentId}/conditions'
};

const getLicenceGaugingStationAdmin = {
  ...externalRoutes.getLicenceGaugingStation,
  config: {
    ...externalRoutes.getLicenceGaugingStation.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/licences/{documentId}/station/{gauging_station}'
};

const getLicenceCommunication = {
  method: 'GET',
  path: '/licences/{documentId}/communications/{communicationId}',
  handler: controller.getLicenceCommunication,
  config: {
    description: 'Look at the content of a message sent to the user regarding the licence',
    validate: {
      params: {
        communicationId: VALID_GUID,
        documentId: VALID_GUID
      }
    },
    plugins: {
      viewContext: {
        activeNavLink: 'view'
      }
    },
    auth: {
      scope: allAdmin
    }
  }
};

const getExpiredLicence = {
  method: 'GET',
  path: '/expired-licences/{documentId}',
  handler: controller.getExpiredLicence,
  config: {
    pre: [
      { method: preInternalView }
    ],
    description: 'Shows expired licence details to internal users',
    validate: {
      params: {
        documentId: VALID_GUID
      }
    },
    plugins: {
      viewContext: {
        activeNavLink: 'view'
      }
    },
    auth: { scope: allAdmin }
  }
};

exports.getExpiredLicence = getExpiredLicence;
exports.getLicenceAdmin = getLicenceAdmin;
exports.getLicenceContactAdmin = getLicenceContactAdmin;
exports.getLicencePurposesAdmin = getLicencePurposesAdmin;
exports.getLicencePointsAdmin = getLicencePointsAdmin;
exports.getLicenceConditionsAdmin = getLicenceConditionsAdmin;
exports.getLicenceGaugingStationAdmin = getLicenceGaugingStationAdmin;
exports.getLicenceCommunication = getLicenceCommunication;
