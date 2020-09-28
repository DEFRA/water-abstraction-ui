const preHandlers = require('./pre-handlers');
const Joi = require('@hapi/joi');
const controllers = require('./controllers');

module.exports = {
  getNew: {
    // Route for starting the flow. Registers data in session.
    method: 'GET',
    path: '/contact-entry/new',
    handler: controllers.getNew,
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          searchQuery: Joi.string().optional(),
          back: Joi.string().optional(),
          redirectPath: Joi.string().required(),
          form: Joi.string().optional()
        }
      }
    }
  },
  getSelectAccountType: {
    // Route for displaying the page for selecting an account type when creating a new contact
    method: 'GET',
    path: '/contact-entry/new/account-type',
    handler: controllers.getSelectAccountTypeController,
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  },
  postSelectAccountType: {
    // Route for selecting an account type when creating a new contact
    method: 'POST',
    path: '/contact-entry/new/account-type',
    handler: controllers.postSelectAccountTypeController
  },
  getEnterNewDetails: {
    // Route for displaying the list of existing contact addresses.
    method: 'GET',
    path: '/contact-entry/new/details',
    handler: controllers.getDetailsController,
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  },
  postCompanySearch: {
    // Route for posting the name or number of a new company contact
    // It searches companies house for a matching company
    method: 'POST',
    path: '/contact-entry/new/details/company-search',
    handler: controllers.postCompanySearchController
  },
  getSelectCompany: {
    method: 'GET',
    path: '/contact-entry/new/details/company-search/select-company',
    handler: controllers.getSelectCompanyController,
    options: {
      pre: [
        { method: preHandlers.searchForCompaniesInCompaniesHouse, assign: 'companiesHouseResults' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  },
  postSelectCompany: {
    method: 'POST',
    path: '/contact-entry/new/details/company-search/select-company',
    handler: controllers.postSelectCompanyController,
    options: {
      pre: [
        { method: preHandlers.searchForCompaniesInCompaniesHouse, assign: 'companiesHouseResults' }
      ]
    }
  },
  getSelectCompanyAddress: {
    method: 'GET',
    path: '/contact-entry/new/details/company-search/select-company-address',
    handler: controllers.getSelectCompanyAddressController,
    options: {
      pre: [
        { method: preHandlers.returnCompanyAddressesFromCompaniesHouse, assign: 'companiesHouseAddresses' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  },
  postSelectCompanyAddress: {
    method: 'POST',
    path: '/contact-entry/new/details/company-search/select-company-address',
    handler: controllers.postSelectCompanyAddressController,
    options: {
      pre: [
        { method: preHandlers.returnCompanyAddressesFromCompaniesHouse, assign: 'companiesHouseAddresses' }
      ]
    }
  }
};
