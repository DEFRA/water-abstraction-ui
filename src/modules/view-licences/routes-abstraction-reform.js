const Joi = require('joi');
const abstractionReform = require('./abstraction-reform');
const { VALID_LICENCE_QUERY } = require('../../lib/validators');
const {
  getLicence,
  getLicenceRename,
  postLicenceRename,
  getLicenceContact,
  getLicencePurposes,
  getLicencePoints,
  getLicenceConditions
} = require('./routes');

module.exports = {
  menu:{
    method: 'GET',
    path: '/ar',
    handler: abstractionReform.menu,
    config: {
      description: 'AR Menu',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction Reform',
        }
      }
    }
  },
  getLicenceAR:  {
      method: 'GET',
      path: '/ar/licences/{licence_id}',
      handler: abstractionReform.getLicence,
      config: {
        description: 'View a AR licence (Abstraction reform R & D)',
        validate: {
          params: {
            licence_id: Joi.string().required().guid()
          }
        }
      }
    },
  updateLicence:  {
      method: 'POST',
      path: '/ar/licences/{licence_id}',
      handler: abstractionReform.updateLicence,
      config: {
        description: 'Update a AR licence (Abstraction reform R & D)',
        validate: {
          params: {
            licence_id: Joi.string().required().guid()
          }
        }
      }
    },

  getLicencesAR: {
    method: 'GET',
    path: '/ar/licences',
    handler: abstractionReform.getLicences,
    config: {
      description: 'abstractionReform: view list of licences with facility to sort/filter',
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
  }
};
