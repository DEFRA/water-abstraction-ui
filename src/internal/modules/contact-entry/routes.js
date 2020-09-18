const preHandlers = require('./pre-handlers');
const Joi = require('@hapi/joi');
const controllers = require('./controllers');

module.exports = {
  // Route for fetching a list of existing contacts that match the search string
  // Expects a GUID as a sessionKey, and a string to search for in the service.
  getSelectContact: {
    method: 'GET',
    path: '/contact-entry/select-contact',
    handler: controllers.getSelectContactController,
    options: {
      pre: [
        // handler to search for existing contacts
        { method: preHandlers.searchForCompaniesByString, assign: 'contactSearchResults' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(), // A UUID used to identify the set of information collected in this flow, stored in yar
          back: Joi.string().required(), // Where users are sent to if they press 'back'
          searchQuery: Joi.string().required(), // The string query used to look for contacts in the CRM database (soft/fuzzy search)
          regionId: Joi.string().uuid().required(), // The UUID for a region associated with the licence. Passed to the invoice-accounts module.
          originalCompanyId: Joi.string().uuid().required(), // The UUID for the parent company, passed from and back to the invoice-accounts module.
          form: Joi.string().optional()
        }
      }
    }
  },
  postSelectContact: {
    // Route for selecting a contact from the list of existing contacts
    // Payload should contain a contact ID
    // If all is well, it directs user to /contact-entry/select-address
    method: 'POST',
    path: '/contact-entry/select-contact',
    handler: controllers.postSelectContactController,
    options: {
      pre: [
        { method: preHandlers.searchForCompaniesByString, assign: 'contactSearchResults' }
      ]
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
  postEnterPersonDetails: {
    // Route for posting the name of a new person contact
    method: 'POST',
    path: '/contact-entry/new/details/person',
    handler: controllers.postPersonDetailsController
  },
  getAfterAddressEntry: {
    method: 'GET',
    path: '/contact-entry/new/details/after-address-entry',
    handler: controllers.getAfterAddressEntryController,
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
  },
  getSelectAddress: {
    // Route for displaying the list of existing contact addresses.
    method: 'GET',
    path: '/contact-entry/select-address',
    handler: controllers.getSelectAddressController,
    options: {
      pre: [
        { method: preHandlers.searchForAddressesByEntityId, assign: 'addressSearchResults' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  },
  postSelectAddress: {
    // Route for selecting an address from the list of existing contact addresses
    // Payload should contain an address ID
    method: 'POST',
    path: '/contact-entry/select-address',
    handler: controllers.postSelectAddressController,
    options: {
      pre: [
        { method: preHandlers.searchForAddressesByEntityId, assign: 'addressSearchResults' }
      ]
    }
  }
};
