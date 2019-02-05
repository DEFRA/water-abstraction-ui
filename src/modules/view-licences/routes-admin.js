const externalRoutes = require('./routes');
const constants = require('../../lib/constants');
const allAdmin = constants.scope.allAdmin;
const { preInternalView } = require('./pre-handlers');

const getLicenceAdmin = {
  ...externalRoutes.getLicence,
  config: {
    ...externalRoutes.getLicence.config,
    pre: [{ method: preInternalView }],
    auth: {
      scope: allAdmin
    }
  },
  path: '/admin/licences/{licence_id}'
};

const getLicenceRenameAdmin = {
  ...externalRoutes.getLicenceRename,
  config: {
    ...externalRoutes.getLicenceRename.config,
    auth: {
      scope: allAdmin
    }
  },
  path: '/admin/licences/{licence_id}/rename'
};

const postLicenceRenameAdmin = {
  ...externalRoutes.postLicenceRename,
  path: '/admin/licences/{licence_id}',
  config: {
    ...externalRoutes.postLicenceRename.config,
    auth: {
      scope: allAdmin
    },
    plugins: {
      ...externalRoutes.postLicenceRename.config.plugins,
      config: {
        ...externalRoutes.postLicenceRename.config.plugins.config,
        redirectBasePath: '/admin/licences'
      }
    }
  }
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

module.exports = {
  getLicenceAdmin,
  getLicenceRenameAdmin,
  postLicenceRenameAdmin,
  getLicenceContactAdmin,
  getLicencePurposesAdmin,
  getLicencePointsAdmin,
  getLicenceConditionsAdmin,
  getLicenceGaugingStationAdmin
};
