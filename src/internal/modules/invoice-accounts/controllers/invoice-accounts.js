'use-strict';
const boom = require('@hapi/boom');
const queryString = require('querystring');
const uuid = require('uuid');
const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const sessionHelper = require('shared/lib/session-helpers');
const ADDRESS_FLOW_SESSION_KEY = require('../../address-entry/plugin').SESSION_KEY;

const { selectCompanyForm, selectCompanyFormSchema } = require('../forms/select-company');
const { selectAddressForm, selectAddressFormSchema } = require('../forms/select-address');
const { selectExistingCompanyForm, selectExistingCompanySchema } = require('../forms/select-existing-company');
const { addFaoForm, addFaoFormSchema } = require('../forms/add-fao');
const { checkDetailsForm } = require('../forms/check-details');

const titleCase = require('title-case');
const { has, isEmpty, assign } = require('lodash');
const urlJoin = require('url-join');

// tempId is used to determine if a new entity should be created.
const tempId = '00000000-0000-0000-0000-000000000000';
const dataService = require('../services/data-service');
const helpers = require('../lib/helpers');

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
  // get the session data to check if the address has been set and if it is new or existing
  const session = dataService.sessionManager(request, regionId, companyId);
  const addresses = await helpers.getAllAddresses(companyId, session);
  if (session.address && session.address.addressId === tempId) { addresses.push(session.address); }
  const selectedAddressId = has(session, 'address') ? session.address.addressId : null;
  return h.view('nunjucks/form', {
    ...request.view,
    caption: helpers.getFormTitleCaption(session.viewData.licenceNumber),
    pageTitle: `Select an existing address for ${session.viewData.companyName}`,
    back: `/invoice-accounts/create/${regionId}/${companyId}?redirectPath=${session.viewData.redirectPath}`,
    form: sessionForms.get(request, selectAddressForm(request, addresses, selectedAddressId))
  });
};

const postAddress = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  const addresses = await helpers.getAllAddresses(companyId, session);
  const schema = selectAddressFormSchema(request.payload);
  const form = forms.handleRequest(selectAddressForm(request, addresses), request, schema);
  if (form.isValid) {
    const { selectedAddress } = forms.getValues(form);
    if (selectedAddress !== tempId) { // selectedAddress is either an address GUID, a tempId, or string `new_address`.
      dataService.sessionManager(request, regionId, companyId, { address: { addressId: selectedAddress } });
    }
    const redirectPath = selectedAddress === 'new_address' ? 'create-address' : 'add-fao';
    return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/${redirectPath}`);
  }
  return h.postRedirectGet(form, urlJoin('/invoice-accounts/create/', regionId, companyId, 'select-address'));
};

// Handles the redirection to the address entry flow
const getCreateAddress = async (request, h) => {
  const { regionId, companyId } = request.params;
  const queryTail = queryString.stringify({
    redirectPath: `/invoice-accounts/create/${regionId}/${companyId}/address-entered`,
    back: `/invoice-accounts/create/${regionId}/${companyId}/check-details`
  });
  return h.redirect(`/address-entry/postcode?${queryTail}`);
};

// Handles the address entered via the address entry flow, and stores it in the session object
const getAddressEntered = async (request, h) => {
  const { regionId, companyId } = request.params;
  // Fetch the address using the address flow session key
  const address = await sessionHelper.saveToSession(request, ADDRESS_FLOW_SESSION_KEY);
  // Store the address in the session object
  dataService.sessionManager(request, regionId, companyId, {
    address: {
      ...address,
      addressId: address.id ? address.id : tempId,
      id: address.id ? address.id : tempId
    }
  });
  // Redirect the user to the check your answers page.
  return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/check-details`);
};

const getContactEntryHandover = async (request, h) => {
  const { regionId, companyId } = request.params;

  let data = await helpers.processContactEntry(request);

  dataService.sessionManager(request, regionId, companyId, data);
  return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/add-fao`);
};

const getFao = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  let selectedContact;
  if (has(session, 'contact')) {
    selectedContact = isEmpty(session.contact) ? 'no' : 'yes';
  } else {
    selectedContact = null;
  }
  return h.view('nunjucks/form', {
    ...request.view,
    caption: helpers.getFormTitleCaption(session.viewData.licenceNumber),
    pageTitle: 'Do you need to add an FAO?',
    back: `/invoice-accounts/create/${regionId}/${companyId}/select-address`,
    form: sessionForms.get(request, addFaoForm(request, selectedContact))
  });
};

const postFao = async (request, h) => {
  const { regionId, companyId } = request.params;
  const schema = addFaoFormSchema(request.payload);
  const form = forms.handleRequest(addFaoForm(request), request, schema);
  if (form.isValid) {
    const { faoRequired } = forms.getValues(form);
    const redirectPath = helpers.processFaoFormData(request, regionId, companyId, faoRequired);
    return h.redirect(urlJoin('/invoice-accounts/create/', regionId, companyId, redirectPath));
  }
  return h.postRedirectGet(form, urlJoin('/invoice-accounts/create/', regionId, companyId, 'add-fao'));
};

const getCheckDetails = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  if (Object.keys(session).length === 0 && session.constructor === Object) {
    throw boom.notFound('Session data not found');
  }
  const selectedContact = isEmpty(session.contact) ? 'No' : await helpers.getContactName(companyId, session.contact);
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
  // The following line is commented out so that the data is
  // not erased, in case the user taps the 'Back' button,
  // returning into the workflow from elsewhere.

  // request.yar.clear(`newInvoiceAccountFlow.${regionId}.${companyId}`);
  const path = redirectPath + '?' + queryString.stringify({ invoiceAccountId: invoiceAcc.id });
  return h.redirect(path);
};

module.exports.getCompany = getCompany;
module.exports.postCompany = postCompany;

module.exports.getSearchCompany = getSearchCompany;
module.exports.postSearchCompany = postSearchCompany;

module.exports.getAddress = getAddress;
module.exports.postAddress = postAddress;

module.exports.getCreateAddress = getCreateAddress;
module.exports.getAddressEntered = getAddressEntered;

module.exports.postFao = postFao;
module.exports.getFao = getFao;

module.exports.getContactEntryHandover = getContactEntryHandover;

module.exports.getCheckDetails = getCheckDetails;
module.exports.postCheckDetails = postCheckDetails;
