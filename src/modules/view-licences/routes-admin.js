const externalRoutes = require('./routes');
const constants = require('../../lib/constants');
const allAdmin = constants.scope.allAdmin;
const { preLoadDocument, preInternalView } = require('./pre-handlers');
const controller = require('./controller');
const { VALID_GUID } = require('../../lib/validators');

const getLicenceAdmin = {
  ...externalRoutes.getLicence,
  config: {
    ...externalRoutes.getLicence.config,
    pre: [
      { method: preLoadDocument },
      { method: preInternalView }
    ],
    auth: {
      scope: allAdmin
    }
  },
  path: '/admin/licences/{licence_id}'
};

const getLicenceContactAdmin = {
  ...externalRoutes.getLicenceContact,
  config: {
    ...externalRoutes.getLicenceContact.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/admin/licences/{licence_id}/contact'
};

const getLicencePurposesAdmin = {
  ...externalRoutes.getLicencePurposes,
  config: {
    ...externalRoutes.getLicencePurposes.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/admin/licences/{licence_id}/purposes'
};

const getLicencePointsAdmin = {
  ...externalRoutes.getLicencePoints,
  config: {
    ...externalRoutes.getLicencePoints.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/admin/licences/{licence_id}/points'
};

const getLicenceConditionsAdmin = {
  ...externalRoutes.getLicenceConditions,
  config: {
    ...externalRoutes.getLicenceConditions.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/admin/licences/{licence_id}/conditions'
};

const getLicenceGaugingStationAdmin = {
  ...externalRoutes.getLicenceGaugingStation,
  config: {
    ...externalRoutes.getLicenceGaugingStation.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/admin/licences/{licence_id}/station/{gauging_station}'
};

const getLicenceCommunication = {
  method: 'GET',
  path: '/admin/licences/{documentId}/communications/{communicationId}',
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

module.exports = {
  getLicenceAdmin,
  getLicenceContactAdmin,
  getLicencePurposesAdmin,
  getLicencePointsAdmin,
  getLicenceConditionsAdmin,
  getLicenceGaugingStationAdmin,
  getLicenceCommunication
};
