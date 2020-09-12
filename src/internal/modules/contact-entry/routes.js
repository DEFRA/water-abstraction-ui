const preHandlers = require('./pre-handlers');
const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const { selectContact, selectAddress, selectFAO, selectAccountType, companySearch, individualName, companySearchSelectCompany, companySearchSelectAddress } = require('./forms');
const Joi = require('@hapi/joi');
const { merge } = require('lodash');

const routes = () => [
  {
    // Route for fetching a list of existing contacts that match the search string
    // Expects a GUID as a sessionKey, and a string to search for in the service.
    method: 'GET',
    path: '/contact-entry/select-contact',
    handler: (request, h) => {
      const { sessionKey, licenceId, back, redirectPath } = request.query;
      // First, store the licence ID in the session, for use in captions
      if (licenceId) {
        let currentState = request.yar.get(sessionKey);
        request.yar.set(sessionKey, merge(currentState, {
          licenceId,
          back,
          redirectPath
        }));
      }
      // Return the view
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Does this contact already exist?',
        form: sessionForms.get(request, selectContact.form(request))
      });
    },
    options: {
      pre: [
        // handler to search for existing contacts
        { method: preHandlers.searchForCompaniesByString, assign: 'contactSearchResults' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required(),
          back: Joi.string().required(),
          searchQuery: Joi.string().optional(),
          redirectPath: Joi.string().required(),
          licenceId: Joi.string().optional(),
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
        // If form is invalid, redirect user back to form
        if (!form.isValid) {
          let { licenceId } = request.yar.get(sessionKey);
          return h.postRedirectGet(form, '/contact-entry/select-contact', {
            sessionKey,
            back: currentState.back,
            searchQuery,
            redirectPath: currentState.redirectPath,
            licenceId
          });
        } else {
          // Contact has been selected. Store the contact ID in yar
          request.yar.set(sessionKey, merge(currentState, { id: id }));
          return h.redirect(`/contact-entry/select-address?sessionKey=${sessionKey}&redirectPath=${currentState.redirectPath}`);
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
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Select the account type',
        form: sessionForms.get(request, selectAccountType.form(request))
      });
    },
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required()
        }
      }
    }
  }, {
    // Route for selecting an account type when creating a new contact
    method: 'POST',
    path: '/contact-entry/new/account-type',
    handler: (request, h) => {

      console.log("=====")
      console.log("=====")
      console.log("=====")
      console.log(request.payload)
      console.log(request.query)
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
        request.yar.set(sessionKey, merge(currentState, { accountType }));
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
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: currentState.accountType === 'company' ? 'Enter the company details' : 'Enter the full name',
        back: request.query.back,
        form: currentState.accountType === 'company' ? sessionForms.get(request, companySearch.form(request)) : sessionForms.get(request, individualName.form(request))
      });
    },
    options: {
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required()
        }
      }
    }
  }, {
    // Route for posting the name of a new individual contact
    method: 'POST',
    path: '/contact-entry/new/details/individual',
    handler: (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      const { individualFullName } = request.payload;
      const form = forms.handleRequest(
        individualName.form(request),
        request,
        individualName.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/new/details', {
          sessionKey
        });
      } else {
        // Contact name has been set. Store the contact name in yar
        request.yar.set(sessionKey, merge(currentState, { individualFullName }));
        // Proceed to the next stage
        // Goes to the address entry workflow
        // TODO: Connect to Dana's address flow
        return h.redirect(`/contact-entry/new/details?sessionKey=${sessionKey}`);
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
      const { companyNameOrNumber } = request.payload;
      const form = forms.handleRequest(
        companySearch.form(request),
        request,
        companySearch.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/new/details', {
          sessionKey
        });
      } else {
        // Company name or number has been set. Store this in yar
        request.yar.set(sessionKey, merge(currentState, { companyNameOrNumber }));
        // Proceed to the next stage
        // Goes to the address entry workflow
        // TODO: Fetch companies from companies house
        return h.redirect(`/contact-entry/new/details/company-search/results?sessionKey=${sessionKey}`);
      }
    }
  }, {
    method: 'GET',
    path: '/contact-entry/new/details/company-search/results',
    handler: async (request, h) => {
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Select a company',
        back: request.query.back,
        form: sessionForms.get(request, companySearchSelectCompany.form(request))
      });
    },
    options: {
      pre: [
        { method: preHandlers.searchForCompaniesInCompaniesHouse, assign: 'companiesHouseResults' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required()
        }
      }
    }
  }, {
    method: 'POST',
    path: '/contact-entry/new/details/company-search/select-company',
    handler: async (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
      const { selectedCompaniesHouseNumber } = request.payload;
      const form = forms.handleRequest(
        companySearchSelectCompany.form(request),
        request,
        companySearchSelectCompany.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        console.log(form)
        return h.postRedirectGet(form, '/contact-entry/new/details/company-search/results', {
          sessionKey
        });
      } else {
        // Company name or number has been set. Store this in yar
        request.yar.set(sessionKey, merge(currentState, { selectedCompaniesHouseNumber }));
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
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Select a company address',
        back: request.query.back,
        form: sessionForms.get(request, companySearchSelectAddress.form(request))
      });
    },
    options: {
      pre: [
        { method: preHandlers.returnCompanyAddressesFromCompaniesHouse, assign: 'companiesHouseAddresses' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required()
        }
      }
    }
  }, {
    method: 'POST',
    path: '/contact-entry/new/details/company-search/select-company-address',
    handler: async (request, h) => {
      const { sessionKey } = request.payload || request.query;
      let currentState = request.yar.get(sessionKey);
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
        return h.redirect(`/contact-entry/fao?sessionKey=${sessionKey}`);
      }
    }
  }, {
    // Route for displaying the list of existing contact addresses.
    method: 'GET',
    path: '/contact-entry/select-address',
    handler: (request, h) => {
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: `Select an address`,
        back: request.query.back,
        form: sessionForms.get(request, selectAddress.form(request))
      });
    },
    options: {
      pre: [
        { method: preHandlers.searchForAddressesByEntityId, assign: 'addressSearchResults' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required()
        }
      }
    }
  }, {
    // Route for selecting an address from the list of existing contact addresses
    // Payload should contain an address ID
    method: 'POST',
    path: '/contact-entry/select-address',
    handler: (request, h) => {
      const { sessionKey, redirectPath } = request.payload || request.query;
      const { id } = request.payload;
      const form = forms.handleRequest(
        selectAddress.form(request),
        request,
        selectAddress.schema
      );
      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/select-address', {
          sessionKey,
          redirectPath
        });
      } else if (id == null) {
        h.redirect(); // TODO redirect to path for creating a new address
      } else {
        // Contact has been selected. Store the contact ID in yar
        let currentState = request.yar.get(sessionKey);
        request.yar.set(sessionKey, merge(currentState, { addressId: id }));
        // return h.redirect(`/contact-entry/fao?sessionKey=${sessionKey}&redirectPath=${redirectPath}`);
        return h.redirect(`/invoice-accounts/create/${currentState.regionId}/${currentState.id}/add-fao`);
      }
    },
    options: {
      pre: [
        { method: preHandlers.fetchRegionByCompanyId, assign: 'companyRegion' },
        { method: preHandlers.searchForAddressesByEntityId, assign: 'addressSearchResults' }
      ]
    }
  }, {
    // Route for displaying the page where a user is asked if they would like to add a FAO
    method: 'GET',
    path: '/contact-entry/fao',
    handler: (request, h) => {
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Do you need to add an FAO?',
        back: request.query.back,
        form: sessionForms.get(request, selectFAO.form(request))
      });
    },
    options: {
      pre: [
        // handler to fetch existing related contacts as FAOs
        { method: preHandlers.searchForFAOsByEntityId, assign: 'FAOSearchResults' }
      ],
      validate: {
        query: {
          sessionKey: Joi.string().uuid().required()
        }
      }
    }
  }
];

exports.routes = routes;
