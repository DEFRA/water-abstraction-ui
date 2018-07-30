const Joi = require('joi');
const admin = require('./admin');
const { VALID_LICENCE_QUERY } = require('../../lib/validators');
const externalRoutes = require('./routes');
const constants = require('../../lib/constants');
const allAdmin = constants.scope.allAdmin;

const getLicencesAdmin = {
  method: 'GET',
  path: '/admin/licences',
  handler: admin.getLicences,
  config: {
    auth: {
      scope: allAdmin
    },
    description: 'Admin: view list of licences with facility to sort/filter',
    validate: {
      query: VALID_LICENCE_QUERY
    },
    plugins: {
      viewContext: {
        pageTitle: 'Licences',
        customTitle: 'Water abstraction or impoundment licences',
        enableSearch: true,
        showEmailFilter: true,
        activeNavLink: 'view'
      },
      formValidator: {
        query: {
          emailAddress: Joi.string().email().allow(''),
          licenceNumber: Joi.string().allow(''),
          sort: Joi.string().valid('licenceNumber', 'name', 'expiryDate').default('licenceNumber'),
          direction: Joi.number().valid(1, -1).default(1),
          page: Joi.number().allow('').min(1).default(1)
        }
      }
    }
  }
};

const getLicenceAdmin = {
  ...externalRoutes.getLicence,
  config: {
    ...externalRoutes.getLicence.config,
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
  getLicencesAdmin,
  getLicenceAdmin,
  getLicenceRenameAdmin,
  postLicenceRenameAdmin,
  getLicenceContactAdmin,
  getLicencePurposesAdmin,
  getLicencePointsAdmin,
  getLicenceConditionsAdmin,
  getLicenceGaugingStationAdmin
};
