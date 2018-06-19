const Joi = require('joi');
const admin = require('./admin');
const { VALID_LICENCE_QUERY } = require('../../lib/validators');
const {
  getLicence,
  getLicenceRename,
  postLicenceRename,
  getLicenceContact,
  getLicencePurposes,
  getLicencePoints,
  getLicenceConditions,
  getLicenceGaugingStation
} = require('./routes');

module.exports = {
  getLicencesAdmin: {
    method: 'GET',
    path: '/admin/licences',
    handler: admin.getLicences,
    config: {
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
            emailAddress: Joi.string().allow('').email(),
            licenceNumber: Joi.string().allow('')
          }
        }
      }
    }
  },
  getLicenceAdmin: {
    ...getLicence,
    path: '/admin/licences/{licence_id}'
  },
  getLicenceRenameAdmin: {
    ...getLicenceRename,
    path: '/admin/licences/{licence_id}/rename'
  },
  postLicenceRenameAdmin: {
    ...postLicenceRename,
    path: '/admin/licences/{licence_id}',
    config: {
      ...postLicenceRename.config,
      plugins: {
        ...postLicenceRename.config.plugins,
        config: {
          ...postLicenceRename.config.plugins.config,
          redirectBasePath: '/admin/licences'
        }
      }
    }
  },
  getLicenceContactAdmin: {
    ...getLicenceContact,
    path: '/admin/licences/{licence_id}/contact'
  },
  getLicencePurposesAdmin: {
    ...getLicencePurposes,
    path: '/admin/licences/{licence_id}/purposes'
  },
  getLicencePointsAdmin: {
    ...getLicencePoints,
    path: '/admin/licences/{licence_id}/points'
  },
  getLicenceConditionsAdmin: {
    ...getLicenceConditions,
    path: '/admin/licences/{licence_id}/conditions'
  },
  getLicenceGaugingStation: {
    ...getLicenceGaugingStation,
    path: '/admin/licences/{licence_id}/station/{gauging_station}'
  }
};
