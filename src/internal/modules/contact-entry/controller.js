'use-strict';

const contactForms = require('./forms');
const forms = require('shared/lib/forms');
const { handleFormRequest } = require('shared/lib/form-handler');
const { CONTACT_TYPES } = require('./lib/constants');
const session = require('./lib/session');

const { omit, omitBy, isEmpty } = require('lodash');

/**
 * returns a form to select existing contacts or options to create a new person or department
 * @param {*} request
 * @param {*} h
 */
const getSelectContact = async (request, h) => {
  const { sessionData, company } = request.pre;

  const pageTitle = company ? `Set up a contact for ${company.name}` : 'Set up a contact';

  return h.view('nunjucks/form', {
    ...request.view,
    caption: sessionData.caption,
    pageTitle,
    back: sessionData.back,
    form: handleFormRequest(request, contactForms.selectContact)
  });
};

const postSelectContact = async (request, h) => {
  const form = handleFormRequest(request, contactForms.selectContact);
  if (!form.isValid) {
    return h.postRedirectGet(form);
  }
  const { key } = request.params;
  const { selectedContact, department } = forms.getValues(form);

  // For person, redirect to contact entry screen
  if (selectedContact === CONTACT_TYPES.person) {
    return h.redirect(`/contact-entry/${key}/create-contact`);
  }

  // Data is department or existing selected contact
  const data = selectedContact === CONTACT_TYPES.department
    ? {
      type: CONTACT_TYPES.department,
      department
    }
    : request.pre.companyContacts.find(row => row.id === selectedContact);

  const { redirectPath } = session.merge(request, key, { data });
  return h.redirect(redirectPath);
};

/**
 * returns a form to enter details for a new contact
 * @param {*} request
 * @param {*} h
 */
const getCreateContact = async (request, h) => {
  const { sessionData, company } = request.pre;

  const pageTitle = company ? `Add a new contact for ${company.name}` : 'Add a new contact';

  return h.view('nunjucks/form', {
    ...request.view,
    caption: sessionData.caption,
    pageTitle,
    back: `/contact-entry/${request.params.key}/select-contact`,
    form: handleFormRequest(request, contactForms.createContact)
  });
};

const postCreateContact = async (request, h) => {
  const form = handleFormRequest(request, contactForms.createContact);
  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  // Retrieve contact data but remember that the back end knows the title as salutation
  const { title, ...formValues
  } = {
    ...omit(omitBy(forms.getValues(form), isEmpty), 'csrf_token')
  };

  if (title) {
    formValues.salutation = title;
  }

  const data = {
    type: CONTACT_TYPES.person,
    source: 'wrls',
    ...formValues
  };

  const { key } = request.params;
  const { redirectPath } = session.merge(request, key, { data });
  return h.redirect(redirectPath);
};

module.exports.getSelectContact = getSelectContact;
module.exports.postSelectContact = postSelectContact;

module.exports.getCreateContact = getCreateContact;
module.exports.postCreateContact = postCreateContact;
