'use-strict';
const boom = require('@hapi/boom');
const queryString = require('querystring');
const uuid = require('uuid');
const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');

const { selectCompanyForm, selectCompanyFormSchema } = require('./forms/select-company');
const { selectExistingCompanyForm, selectExistingCompanySchema } = require('./forms/select-existing-company');
const { addFaoForm, addFaoFormSchema } = require('./forms/add-fao');
const { checkDetailsForm } = require('./forms/check-details');

const titleCase = require('title-case');
const { has, isEmpty, assign, get } = require('lodash');
const urlJoin = require('url-join');

const dataService = require('./services/data-service');
const helpers = require('./lib/helpers');

const getCompany = async (request, h) => {
  const { regionId, companyId } = request.params;
  const { licenceId, redirectPath } = request.query;
  const { companies } = request.pre;
  // licenceId is an optional query param. if supplied it will be displayed as the caption on the forms for the session
  const { licenceNumber } = licenceId ? await dataService.getLicenceById(licenceId) : { licenceNumber: null };
  // The company name and licence number set here will be used in the select address page
  const data = { viewData: { redirectPath, licenceNumber, licenceId, companyName: titleCase(companies[0].name) } };
  const session = dataService.sessionManager(request, regionId, companyId, data);
  const selectedCompany = has(session, 'agent') && isEmpty(session.agent) ? companies[0] : companies[1];

  return h.view('nunjucks/form', {
    ...request.view,
    caption: helpers.getFormTitleCaption(licenceNumber),
    pageTitle: 'Who should the bills go to?',
    back: '/manage',
    form: sessionForms.get(request, selectCompanyForm(request, companies, selectedCompany))
  });
};

const postCompany = async (request, h) => {
  const { regionId, companyId } = request.params;
  const { companies } = request.pre;
  const schema = selectCompanyFormSchema(request.payload);
  const form = forms.handleRequest(selectCompanyForm(request, companies), request, schema);
  const { viewData } = await dataService.sessionManager(request, regionId, companyId);
  if (form.isValid) {
    const redirectPath = helpers.processCompanyFormData(request, regionId, companyId, form);
    return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/${redirectPath}`);
  }
  return h.postRedirectGet(form, urlJoin('/invoice-accounts/create/', regionId, companyId), { redirectPath: viewData.redirectPath });
};

const getSearchCompany = async (request, h) => {
  const { regionId, companyId } = request.params;
  // Return the view
  const { viewData, agent } = dataService.sessionManager(request, regionId, companyId);
  let selectedContactId = agent ? agent.id : null;

  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Does this contact already exist?',
    back: `/invoice-accounts/create/${regionId}/${companyId}?redirectPath=${viewData.redirectPath}`,
    form: sessionForms.get(request, selectExistingCompanyForm(request, selectedContactId))
  });
};

const postSearchCompany = async (request, h) => {
  const { id, filter } = request.payload;
  const { regionId, companyId } = request.params;
  const form = forms.handleRequest(selectExistingCompanyForm(request), request, selectExistingCompanySchema);
  if (form.isValid) {
    if (id === 'new') {
      const volatileKey = uuid();
      const path = `/contact-entry/new?` + queryString.stringify({
        searchQuery: filter,
        sessionKey: volatileKey,
        back: `/invoice-accounts/create/${regionId}/${companyId}/contact-search`,
        redirectPath: `/invoice-accounts/create/${regionId}/${companyId}/contact-entry-complete?sessionKey=${volatileKey}`
      });
      return h.redirect(path);
    } else {
      // Fetch the current session object, so we can update the viewData nested object
      const existingState = await dataService.sessionManager(request, regionId, companyId);
      // Update the session with the selected agent (if applicable) and display the company name
      await dataService.sessionManager(request, regionId, companyId, {
        agent: { companyId: id },
        viewData: assign({}, existingState.viewData, { companyName: titleCase(request.pre.contactSearchResults.find(x => x.id === id).name || 'the agent') })
      });
      return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/select-address`);
    }
  } else {
    return h.postRedirectGet(form, urlJoin('/invoice-accounts/create/', regionId, companyId, `contact-search`), { filter });
  }
};

const getAddress = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);

  // If the invoice account is delegated to an agent, present that company's addresses to
  // choose from
  // @todo this doesn't work in all cases presently as the contact plugin populates the .id property
  // of the property with an all-zero guid - we should remove this behaviour so that non-persisted
  // companies have no .id property
  const addressPluginCompanyId = session.agent ? session.agent.id : companyId;

  const path = request.addressLookupRedirect({
    redirectPath: `/invoice-accounts/create/${regionId}/${companyId}/address-entered`,
    back: `/invoice-accounts/create/${regionId}/${companyId}`,
    key: helpers.getFlowKey(request),
    companyId: addressPluginCompanyId,
    caption: helpers.getFormTitleCaption(session.viewData.licenceNumber)
  });

  return h.redirect(path);
};

// Handles the return from the address entry flow, gets address and stores it in the session object
const getAddressEntered = async (request, h) => {
  const { regionId, companyId } = request.params;

  // Get address from address plugin flow and store in session
  const address = request.getNewAddress(helpers.getFlowKey(request));
  dataService.sessionManager(request, regionId, companyId, { address });

  // Redirect the user to the 'do you need to add an FAO'
  return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/add-fao`);
};

const getContactEntered = async (request, h) => {
  const { regionId, companyId } = request.params;

  const contact = request.getNewContact(helpers.getFlowKey(request));
  dataService.sessionManager(request, regionId, companyId, { contact });
  return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/check-details`);
};

const getFao = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);

  return h.view('nunjucks/form', {
    ...request.view,
    caption: helpers.getFormTitleCaption(session.viewData.licenceNumber),
    pageTitle: 'Do you need to add an FAO?',
    back: `/invoice-accounts/create/${regionId}/${companyId}/select-address`,
    form: sessionForms.get(request, addFaoForm(request, session.contact))
  });
};

const postFao = async (request, h) => {
  const { regionId, companyId } = request.params;
  const schema = addFaoFormSchema(request.payload);
  const form = forms.handleRequest(addFaoForm(request), request, schema);
  if (!form.isValid) {
    return h.postRedirectGet(form);
  }
  const { faoRequired } = forms.getValues(form);
  if (faoRequired) {
    const session = dataService.sessionManager(request, regionId, companyId);
    const key = helpers.getFlowKey(request);
    // redirect to contact entry plugin
    const path = request.contactEntryRedirect({
      redirectPath: `/invoice-accounts/create/${regionId}/${companyId}/contact-entered`,
      back: `/invoice-accounts/create/${regionId}/${companyId}`,
      key,
      companyId: session.agent ? session.agent.id : companyId,
      caption: helpers.getFormTitleCaption(session.viewData.licenceNumber),
      data: session.contact
    });

    return h.redirect(path);
  }

  // save contact as null and go to check details page
  dataService.sessionManager(request, regionId, companyId, { contact: null });
  return h.redirect(urlJoin('/invoice-accounts/create/', regionId, companyId, 'check-details'));
};

const getCheckDetails = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);

  if (Object.keys(session).length === 0 && session.constructor === Object) {
    throw boom.notFound('Session data not found');
  }
  const selectedContact = helpers.getSelectedContact(session, request.pre.companyContacts);
  const selectedAddress = await helpers.getSelectedAddress(companyId, session);
  const { companies } = request.pre;

  let company;
  if (has(session, 'agent.companyId')) {
    company = companies[1];
  } else {
    company = companies[0];
  }
  return h.view('nunjucks/invoice-accounts/check-details', {
    ...request.view,
    form: sessionForms.get(request, checkDetailsForm(request)),
    caption: helpers.getFormTitleCaption(session.viewData.licenceNumber),
    pageTitle: 'Check billing account details',
    back: '/manage',
    session,
    company,
    selectedAddress,
    selectedContact
  });
};

const postCheckDetails = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  const redirectPath = session.viewData.redirectPath;
  // Formulate the body of the request
  const requestBody = await helpers.postDataHandler(request);

  // Make the request
  const invoiceAcc = await dataService.saveInvoiceAccDetails(companyId, requestBody);
  request.yar.clear(`newInvoiceAccountFlow.${regionId}.${companyId}`);
  const path = redirectPath + '?' + queryString.stringify({ invoiceAccountId: invoiceAcc.id });
  return h.redirect(path);
};

module.exports.getCompany = getCompany;
module.exports.postCompany = postCompany;

module.exports.getSearchCompany = getSearchCompany;
module.exports.postSearchCompany = postSearchCompany;

module.exports.getAddress = getAddress;
module.exports.getAddressEntered = getAddressEntered;

module.exports.postFao = postFao;
module.exports.getFao = getFao;

module.exports.getContactEntered = getContactEntered;

module.exports.getCheckDetails = getCheckDetails;
module.exports.postCheckDetails = postCheckDetails;
