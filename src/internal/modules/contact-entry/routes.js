const preHandlers = require('./pre-handlers');
const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const { selectContact, selectAddress, selectFAO } = require('./forms');
const Joi = require('@hapi/joi');
const { merge } = require('lodash');

const routes = () => [
  {
    // Route for fetching a list of existing contacts that match the search string
    // Expects a GUID as a sessionKey, and a string to search for in the service.
    method: 'GET',
    path: '/contact-entry/select-contact',
    handler: (request, h) => {
      return h.view('nunjucks/contact-entry/basic-form', {
        ...request.view,
        pageTitle: 'Who should the bills go to?',
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
          redirectPath: Joi.string().required()
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
      const { sessionKey, redirectPath } = request.payload || request.query;
      const { id, searchQuery } = request.payload;
      const form = forms.handleRequest(
        selectContact.form(request),
        request,
        selectContact.schema
      );

      // If form is invalid, redirect user back to form
      if (!form.isValid) {
        return h.postRedirectGet(form, '/contact-entry/select-contact', {
          sessionKey,
          searchQuery,
          redirectPath
        });
      } else if (id == null) {
        h.redirect(); // TODO redirect to path for creating a new contact
      } else {
        // Contact has been selected. Store the contact ID in yar
        request.yar.set(sessionKey, { id: id });
        return h.redirect(`/contact-entry/select-address?sessionKey=${sessionKey}&redirectPath=${redirectPath}`);
      }
    },
    options: {
      pre: [
        { method: preHandlers.searchForCompaniesByString, assign: 'contactSearchResults' }
      ]
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
      ]
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
        let currentState = request.yar.get(sessionKey)

        request.yar.set(sessionKey, merge(currentState, { addressId: id }));
        return h.redirect(`/contact-entry/fao?sessionKey=${sessionKey}&redirectPath=${redirectPath}`);
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
      ]
    }
  }
];

exports.routes = routes;

/* {
    // Route for displaying the page where a user is asked if they would like to add a FAO
    method: 'GET',
    path: '/contact-entry/fao',
    options: {
      pre: [
        // handler to fetch existing related contacts as FAOs
        { method: preHandlers.searchForFAOsByEntityId, assign: 'FAOSearchResults' }
      ]
    }
  },
  {
    // Route for adding FAO information
    method: 'POST',
    path: '/contact-entry/fao'
  },
  {
    // Route for displaying the page where a user is asked for the date the change applies from
    method: 'GET',
    path: '/contact-entry/date'
  },
  {
    // Route for adding FAO information
    method: 'POST',
    path: '/contact-entry/date'
  },
  {
    // Route for viewing the 'check your answers' page
    method: 'GET',
    path: '/contact-entry/check'
  },
  {
    // Route for confirming answers page.
    method: 'POST',
    path: '/contact-entry/check'
  }
  */