const preHandlers = require('./pre-handlers');
const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const { selectContact, selectAddress, FAORequired, selectAccountType, companySearch, personName, companySearchSelectCompany, companySearchSelectAddress } = require('./forms');
const Joi = require('@hapi/joi');
const queryString = require('querystring');
const { merge } = require('lodash');
const addressEntryHelpers = require('../address-entry/lib/helpers');

const routes = () => [
  {
    // Route for fetching a list of existing contacts that match the search string
    // Expects a GUID as a sessionKey, and a string to search for in the service.
    method: 'GET',
    path: '/contact-entry/select-contact',
    handler: (request, h) => {
      const { sessionKey, regionId, back, searchQuery } = request.query;
      // First, store the licence ID in the session, for use in captions

      let currentState = request.yar.get(sessionKey);
      request.yar.set(sessionKey, merge(currentState, {
        back,
        regionId,
        searchQuery
      }));

      let defaultValue = currentState ? currentState.id : null;

      // Return the view
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Does this contact already exist?',
        form: sessionForms.get(request, selectContact.form(request, defaultValue))
      });
    },
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
          form: Joi.string().optional()
        }
      }
    }
  }, {
    // Route for selecting a contact from the list of existing contacts
    // Payload should contain a contact ID
    // If all is well, it directs user to /contact-entry/select-address
    method: 'POST',
    path: '/contact-entry/select-contact',
    handler: (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      const { id, searchQuery } = request.payload;
      if (id === null || id === 'new') {
        return h.redirect(`/contact-entry/new/account-type?sessionKey=${sessionKey}`);
      } else {
        const form = forms.handleRequest(
          selectContact.form(request),
          request,
          selectContact.schema
        );
        if (!form.isValid) {
          return h.postRedirectGet(form, '/contact-entry/select-contact', {
            sessionKey,
            back: currentState.back,
            searchQuery
          });
        } else {
          // Contact has been selected. Store the contact ID in yar
          request.yar.set(sessionKey, merge(currentState, { newCompany: false, id: id }));
          return h.redirect(`/contact-entry/select-address?sessionKey=${sessionKey}`);
        }
      }
    },
    options: {
      pre: [
        { method: preHandlers.searchForCompaniesByString, assign: 'contactSearchResults' }
      ]
    }
  }, {
    // Route for displaying the page for selecting an account type when creating a new contact
    method: 'GET',
    path: '/contact-entry/new/account-type',
    handler: (request, h) => {
      const { sessionKey } = request.query;
      let currentState = request.yar.get(sessionKey);
      let defaultValue = currentState.accountType;
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Select the account type',
        form: sessionForms.get(request, selectAccountType.form(request, defaultValue))
      });
    },
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  }, {
    // Route for selecting an account type when creating a new contact
    method: 'POST',
    path: '/contact-entry/new/account-type',
    handler: (request, h) => {
      const { sessionKey } = request.payload || request.query;

      let currentState = request.yar.get(sessionKey);
      const { accountType } = request.payload;
      const form = forms.handleRequest(
        selectAccountType.form(request),
        request,
        selectAccountType.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/new/account-type', {
          sessionKey
        });
      } else {
        // Contact has been selected. Store the contact account type in yar
        request.yar.set(sessionKey, merge(currentState, { newCompany: true, accountType }));
        // Proceed to the next stage
        return h.redirect(`/contact-entry/new/details?sessionKey=${sessionKey}`);
      }
    },
    options: {
      pre: []
    }
  }, {
    // Route for displaying the list of existing contact addresses.
    method: 'GET',
    path: '/contact-entry/new/details',
    handler: (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      let defaultValue = currentState.accountType === 'organisation' ? (currentState.companyNameOrNumber ? currentState.companyNameOrNumber : currentState.searchQuery) : (currentState.personName ? currentState.personName : currentState.searchQuery);
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: currentState.accountType === 'organisation' ? 'Enter the company details' : 'Enter the full name',
        back: request.query.back,
        form: currentState.accountType === 'organisation' ? sessionForms.get(request, companySearch.form(request, defaultValue)) : sessionForms.get(request, personName.form(request, defaultValue))
      });
    },
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  }, {
    // Route for posting the name of a new person contact
    method: 'POST',
    path: '/contact-entry/new/details/person',
    handler: (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      console.log(currentState)
      const { personFullName } = request.payload;
      const form = forms.handleRequest(
        personName.form(request),
        request,
        personName.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/new/details/person', {
          sessionKey
        });
      } else {
        // Contact name has been set. Store the contact name in yar
        request.yar.set(sessionKey, merge(currentState, { personFullName }));
        // Proceed to the next stage
        // Goes to the address entry workflow
        const queryTail = queryString.stringify({
          redirectPath: `/contact-entry/new/details/after-address-entry?sessionKey=${sessionKey}`,
          back: `/contact-entry/new/details?sessionKey=${sessionKey}`
        });
        return h.redirect(`/address-entry/postcode?${queryTail}`);
      }
    }
  }, {
    method: 'GET',
    path: '/contact-entry/new/details/after-address-entry',
    handler: (request, h) => {
      // This is the path the user is redirected to after the address entry flow
      // Sets the address in the yar object, and redirects to FAO pages
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      let address = request.yar.get(addressEntryHelpers.SESSION_KEY);
      request.yar.set(sessionKey, merge(currentState, { personAddress: address }));

      return h.redirect(`/contact-entry/new/details/fao?sessionKey=${sessionKey}`);
    },
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  }, {
    // Route for posting the name or number of a new company contact
    // It searches companies house for a matching company
    method: 'POST',
    path: '/contact-entry/new/details/company-search',
    handler: async (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      console.log(currentState)
      const { companyNameOrNumber } = request.payload;
      const form = forms.handleRequest(
        companySearch.form(request),
        request,
        companySearch.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/new/details/company-search', {
          sessionKey
        });
      } else {
        // Company name or number has been set. Store this in yar
        request.yar.set(sessionKey, merge(currentState, { companyNameOrNumber }));
        // Proceed to the next stage
        // Goes to the address entry workflow
        // TODO: Fetch companies from companies house
        return h.redirect(`/contact-entry/new/details/company-search/select-company?sessionKey=${sessionKey}`);
      }
    }
  }, {
    method: 'GET',
    path: '/contact-entry/new/details/company-search/select-company',
    handler: async (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      let defaultValue = currentState.selectedCompaniesHouseNumber;

      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Select a company',
        back: request.query.back,
        form: sessionForms.get(request, companySearchSelectCompany.form(request, defaultValue))
      });
    },
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
  }, {
    method: 'POST',
    path: '/contact-entry/new/details/company-search/select-company',
    handler: async (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      console.log(currentState)
      const { selectedCompaniesHouseNumber } = request.payload;
      const form = forms.handleRequest(
        companySearchSelectCompany.form(request),
        request,
        companySearchSelectCompany.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/new/details/company-search/select-company', {
          sessionKey
        });
      } else {
        // Company name or number has been set. Store this in yar
        request.yar.set(sessionKey, merge(currentState, {
          selectedCompaniesHouseNumber,
          selectedCompaniesHouseCompanyName: request.pre.companiesHouseResults.find(x => x.company.companyNumber === selectedCompaniesHouseNumber).company.name,
          organisationType: request.pre.companiesHouseResults.find(x => x.company.companyNumber === selectedCompaniesHouseNumber).company.organisationType
        }));
        // Proceed to the next stage
        return h.redirect(`/contact-entry/new/details/company-search/select-company-address?sessionKey=${sessionKey}`);
      }
    },
    options: {
      pre: [
        { method: preHandlers.searchForCompaniesInCompaniesHouse, assign: 'companiesHouseResults' }
      ]
    }
  }, {
    method: 'GET',
    path: '/contact-entry/new/details/company-search/select-company-address',
    handler: async (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      console.log(currentState)
      let defaultValue = currentState.selectedCompaniesHouseAddress;
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Select a company address',
        back: request.query.back,
        form: sessionForms.get(request, companySearchSelectAddress.form(request, defaultValue))
      });
    },
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
  }, {
    method: 'POST',
    path: '/contact-entry/new/details/company-search/select-company-address',
    handler: async (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      console.log(currentState)
      const { selectedCompaniesHouseAddress } = request.payload;
      const form = forms.handleRequest(
        companySearchSelectAddress.form(request),
        request,
        companySearchSelectAddress.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/new/details/company-search/select-company-address', {
          sessionKey
        });
      } else {
        // Company name or number has been set. Store this in yar
        request.yar.set(sessionKey, merge(currentState, { selectedCompaniesHouseAddress }));
        // Proceed to the next stage
        return h.redirect(`/contact-entry/new/details/fao?sessionKey=${sessionKey}`);
      }
    }
  }, {
    // Route for displaying the list of existing contact addresses.
    method: 'GET',
    path: '/contact-entry/select-address',
    handler: (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      console.log(currentState)
      let defaultValue = currentState.addressId;
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: `Select an address`,
        back: request.query.back,
        form: sessionForms.get(request, selectAddress.form(request, defaultValue))
      });
    },
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
  }, {
    // Route for selecting an address from the list of existing contact addresses
    // Payload should contain an address ID
    method: 'POST',
    path: '/contact-entry/select-address',
    handler: (request, h) => {
      const { sessionKey } = request.payload || request.query;
      const { id } = request.payload;
      const form = forms.handleRequest(
        selectAddress.form(request),
        request,
        selectAddress.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/select-address', {
          sessionKey
        });
      } else if (id === 'new') {
        // TODO redirect to path for creating a new address (Dana's flow)
        const queryTail = queryString.stringify({
          redirectPath: `/contact-entry/new/details/after-address-entry?sessionKey=${sessionKey}`,
          back: `/contact-entry/new/details?sessionKey=${sessionKey}`
        });
        return h.redirect(`/address-entry/postcode?${queryTail}`);
      } else {
        // Contact has been selected. Store the contact ID in yar
        let currentState = request.yar.get(sessionKey);
        console.log(currentState)
        request.yar.set(sessionKey, merge(currentState, { addressId: id }));
        // Send user to the next step, where they are asked if they would like to add FAO
        return h.redirect(`/contact-entry/new/details/fao?sessionKey=${sessionKey}`);
      }
    },
    options: {
      pre: [
        { method: preHandlers.searchForAddressesByEntityId, assign: 'addressSearchResults' }
      ]
    }
  }, {
    // Route for displaying the page where a user is asked if they would like to add a FAO
    method: 'GET',
    path: '/contact-entry/new/details/fao',
    handler: (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      console.log(currentState)
      let defaultValue = currentState.FAOIsRequired;
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Do you need to add an FAO?',
        back: request.query.back,
        form: sessionForms.get(request, FAORequired.form(request, defaultValue))
      });
    },
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          form: Joi.string().optional()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/contact-entry/new/details/fao',
    handler: async (request, h) => {
      const { sessionKey } = request.payload || request.query;
      console.log("FAO")
      console.log("FAO")
      console.log(sessionKey)
      console.log("FAO")
      let currentState = request.yar.get(sessionKey);
      console.log(currentState)
      const { FAOIsRequired } = request.payload;
      const form = forms.handleRequest(
        FAORequired.form(request),
        request,
        FAORequired.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        console.log("caught here")
        console.log("caught here")
        console.log("caught here")
        return h.postRedirectGet(form, '/contact-entry/new/details/fao', {
          sessionKey
        });
      } else {
        // FAOIsRequired value has been set. Store this in yar
        request.yar.set(sessionKey, merge(currentState, { FAOIsRequired }));
        // TODO redirect to Stephan's FAO flow
        return h.redirect(`/invoice-accounts/create/${currentState.regionId}/${request.pre.storedCompanyId}/contact-entry-complete`);
      }
    },
    options: {
      pre: [
        { method: preHandlers.persistCompanyInDatabase, assign: 'storedCompanyId' }, // Saves the company in the database, and return a company Id. This is needed because the invoice-accounts flow requires a companyId as a param
        { method: preHandlers.searchForCompaniesInCompaniesHouse, assign: 'companiesHouseResults' }
      ]
    }
  }
];

exports.routes = routes;
