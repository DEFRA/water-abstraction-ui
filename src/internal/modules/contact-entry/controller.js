'use-strict';

const contactForms = require('./forms');
const forms = require('shared/lib/forms');
const { handleFormRequest } = require('shared/lib/form-handler');
const { CONTACT_TYPES } = require('./lib/constants');
const { getSelectedContact } = require('./lib/helpers');
const session = require('./lib/session');

const { omit, omitBy, isEmpty } = require('lodash');

/**
 * returns a form to select existing contacts or options to create a new person or department
 * @param {*} request
 * @param {*} h
 */
const getSelectContact = async (request, h) => {
  const { sessionData, company } = request.pre;
  return h.view('nunjucks/form', {
    ...request.view,
    caption: sessionData.caption,
    pageTitle: `Setup a contact for ${company.name}`,
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

  if (selectedContact === CONTACT_TYPES.person) {
    return h.redirect(`/contact-entry/${key}/create-contact`);
  }

  const contact = getSelectedContact(selectedContact, department);
  const { redirectPath } = session.merge(request, key, { data: contact });
  return h.redirect(redirectPath);
};

/**
 * returns a form to enter details for a new contact
 * @param {*} request
 * @param {*} h
 */
const getCreateContact = async (request, h) => {
  const { sessionData, company } = request.pre;

  return h.view('nunjucks/form', {
    ...request.view,
    caption: sessionData.caption,
    pageTitle: `Add a new contact for ${company.name}`,
    back: `/contact-entry/${request.params.key}/select-contact`,
    form: handleFormRequest(request, contactForms.createContact)
  });
};

const postCreateContact = async (request, h) => {
  const form = handleFormRequest(request, contactForms.createContact);
  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const data = {
    type: CONTACT_TYPES.person,
    source: 'wrls',
    ...omit(omitBy(forms.getValues(form), isEmpty), 'csrf_token')
  };

  const { key } = request.params;
  const { redirectPath } = session.merge(request, key, { data });
  return h.redirect(redirectPath);
};

module.exports.getSelectContact = getSelectContact;
module.exports.postSelectContact = postSelectContact;

module.exports.getCreateContact = getCreateContact;
module.exports.postCreateContact = postCreateContact;
