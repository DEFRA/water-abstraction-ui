const Joi = require('joi')
const controller = require('./controller')
const { VALID_GUID, VALID_LICENCE_QUERY } = require('shared/lib/validators')

const { scope } = require('../../lib/constants')

const allowedScopes = [scope.licenceHolder, scope.colleague, scope.colleagueWithReturns]

const getLicenceRename = {
  method: 'GET',
  path: '/licences/{documentId}/rename',
  handler: controller.getLicenceRename,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'Set user-defined name for licence',
    validate: {
      params: Joi.object().keys({
        documentId: VALID_GUID
      })
    },
    plugins: {
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
}

const postLicenceRename = {
  method: 'POST',
  path: '/licences/{documentId}/rename',
  handler: controller.postLicenceRename,
  config: {
    description: 'Update the user-defined licence name',
    auth: {
      scope: allowedScopes
    },
    validate: {
      params: Joi.object().keys({
        documentId: VALID_GUID
      }),
      payload: Joi.object().keys({
        name: Joi.string().allow(''),
        csrf_token: VALID_GUID
      })
    },
    plugins: {
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
}

module.exports = {
  getLicences: {
    method: 'GET',
    path: '/licences',
    handler: controller.getLicences,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'View list of licences with facility to sort/filter',
      validate: {
        query: VALID_LICENCE_QUERY,
        options: {
          // Adding this flag will allow params outside of the VALID_LICENCE_QUERY
          // keys, without adding them to query.params. This is required because
          // a user could end up landing here with the _ga query param if they
          // are coming via https://www.gov.uk/guidance/manage-your-water-abstraction-or-impoundment-licences-online
          stripUnknown: true
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Your licences',
          customTitle: 'Your water abstraction or impoundment licences',
          showResults: true,
          activeNavLink: 'view'
        },
        licenceLoader: {
          loadOutstandingVerifications: true,
          loadUserLicenceCount: true
        },
        formValidator: {
          query: {
            emailAddress: Joi.string().allow('').email(),
            licenceNumber: Joi.string().allow(''),
            sort: Joi.string().valid('licenceNumber', 'name', 'expiryDate').default('licenceNumber'),
            direction: Joi.number().valid(1, -1).default(1),
            page: Joi.number().allow('').min(1).default(1)
          }
        }
      }
    }
  },
  getLicenceRename,
  postLicenceRename
}
