'use-strict';

const dataService = require('../services/data-service');
const helpers = require('../lib/helpers');
const { selectContactForm, selectContactFormSchema } = require('../forms/select-contact');
const { createContactForm, createContactFormSchema } = require('../forms/create-contact');
const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const urlJoin = require('url-join');
const { has, isEmpty, omit, pickBy } = require('lodash');

/**
 * returns a form to select existing contacts or options to create a new person or department
 * @param {*} request
 * @param {*} h
 */
const getContactSelect = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  const contacts = await dataService.getCompanyContacts(companyId);
  const selectedContact = has(session, 'contact') ? session.contact : null;
  return h.view('nunjucks/form', {
    ...request.view,
    caption: helpers.getFormTitleCaption(session.viewData.licenceNumber),
    pageTitle: `Setup a contact for ${session.viewData.companyName}`,
    back: '/manage',
    form: sessionForms.get(request, selectContactForm(request, contacts, selectedContact))
  });
};

const postContactSelect = async (request, h) => {
  const { regionId, companyId } = request.params;
  const schema = selectContactFormSchema(request.payload);
  const contacts = await dataService.getCompanyContacts(companyId);
  const form = forms.handleRequest(selectContactForm(request, contacts), request, schema);
  if (form.isValid) {
    const { selectedContact, department } = forms.getValues(form);
    // if it is a new person contact
    if (selectedContact === 'person') {
      return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/create-contact`);
    } else {
      helpers.processSelectContactFormData(request, regionId, companyId, selectedContact, department);
      return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/check-details`);
    };
  }
  return h.postRedirectGet(form, urlJoin('/invoice-accounts/create/', regionId, companyId, 'select-contact'));
};

/**
 * returns a form to enter details for a new contact
 * @param {*} request
 * @param {*} h
 */
const getContactCreate = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  const selectedContact = isEmpty(session.contact) ||
  (has(session.contact, 'department') && !has(session.contact, 'firstName')) ? {} : session.contact;

  return h.view('nunjucks/form', {
    ...request.view,
    caption: helpers.getFormTitleCaption(session.viewData.licenceNumber),
    pageTitle: `Add a new contact for ${session.viewData.companyName}`,
    back: '/manage',
    form: sessionForms.get(request, createContactForm(request, selectedContact))
  });
};

const postContactCreate = async (request, h) => {
  const { regionId, companyId } = request.params;
  const schema = createContactFormSchema(request.payload);
  const form = forms.handleRequest(createContactForm(request), request, schema);
  if (form.isValid) {
    // remove empty elements where values were left blank on the form
    const formData = pickBy(omit(forms.getValues(form), 'csrf_token'), (value, key) => { return !(isEmpty(value)); });
    // get the session
    const session = dataService.sessionManager(request, regionId, companyId);
    // reset the session contact if it exists
    if (!isEmpty(session.contact)) { dataService.sessionManager(request, regionId, companyId, { contact: null }); }
    // set the new contact
    dataService.sessionManager(request, regionId, companyId, { contact: { ...formData, type: 'person' } });
    return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/check-details`);
  }
  return h.postRedirectGet(form, urlJoin('/invoice-accounts/create/', regionId, companyId, 'create-contact'));
};

module.exports.getContactSelect = getContactSelect;
module.exports.postContactSelect = postContactSelect;

module.exports.getContactCreate = getContactCreate;
module.exports.postContactCreate = postContactCreate;
