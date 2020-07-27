'use-strict';
const boom = require('@hapi/boom');
const queryString = require('querystring');
const moment = require('moment');
const sessionForms = require('shared/lib/session-forms');
const { selectCompanyForm, selectCompanyFormSchema } = require('./forms/select-company');
const { selectAddressForm, selectAddressFormSchema } = require('./forms/select-address');
const { addFaoForm, addFaoFormSchema } = require('./forms/add-fao');
const { checkDetailsForm } = require('./forms/check-details');
const forms = require('shared/lib/forms');
// tempId is used to determine if a new entity should be created.
const tempId = '00000000-0000-0000-0000-000000000000';
const dataService = require('./lib/data-service');
const urlJoin = require('url-join');
const { processCompanyFormData, processFaoFormData, getSelectedAddress } = require('./lib/helpers');

const getCaption = (licenceNumber) => {
  return licenceNumber ? `Licence ${licenceNumber}` : '';
};

const getCompany = async (request, h) => {
  const { regionId, companyId } = request.params;
  const { licenceId, redirectPath } = request.query;
  // licenceId is an optional query param. if supplied it will be displayed as the caption on the forms for the session
  const { licenceNumber } = licenceId ? await dataService.getLicenceById(licenceId) : { licenceNumber: null };
  const company = await dataService.getCompany(companyId);
  // The company name and licence number set here will be used in the select address page
  const data = { viewData: { redirectPath, licenceNumber, licenceId, companyName: company.name } };
  const session = dataService.sessionManager(request, regionId, companyId, data);
  const selectedCompany = session.agent ? await dataService.getCompany(session.agent) : company;
  return h.view('nunjucks/form', {
    ...request.view,
    caption: getCaption(licenceNumber),
    pageTitle: 'Who should the bills go to?',
    back: '/manage',
    form: sessionForms.get(request, selectCompanyForm(request, company, selectedCompany))
  });
};

const postCompany = async (request, h) => {
  const { regionId, companyId } = request.params;
  const company = await dataService.getCompany(companyId);
  const schema = selectCompanyFormSchema(request.payload);
  const form = forms.handleRequest(selectCompanyForm(request, company), request, schema);
  if (form.isValid) {
    const redirectPath = processCompanyFormData(request, regionId, companyId, form);
    return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/${redirectPath}`);
  }
  const { viewData: { redirectPath } } = dataService.sessionManager(request, regionId, companyId);
  return h.postRedirectGet(form, urlJoin('/invoice-accounts/create/', regionId, companyId), { redirectPath });
};

const getAddress = async (request, h) => {
  const { regionId, companyId } = request.params;
  const addresses = await dataService.getCompanyAddresses(companyId);
  // get the session data to check if the address has been set and if it is new or existing
  const session = dataService.sessionManager(request, regionId, companyId);
  // @TODO this might need a mapper to map the session address data to the Company address shape passed to the form
  if (session.address && session.address.addressId === tempId) { addresses.push(session.address); }
  const selectedAddress = session.address ? session.address.addressId : null;
  return h.view('nunjucks/form', {
    ...request.view,
    caption: getCaption(session.viewData.licenceNumber),
    pageTitle: `Select an existing address for ${session.viewData.companyName}`,
    back: '/manage',
    form: sessionForms.get(request, selectAddressForm(request, addresses, selectedAddress))
  });
};

const postAddress = async (request, h) => {
  const { regionId, companyId } = request.params;
  const addresses = await dataService.getCompanyAddresses(companyId);
  const schema = selectAddressFormSchema(request.payload);
  const form = forms.handleRequest(selectAddressForm(request, addresses), request, schema);
  if (form.isValid) {
    const { selectedAddress } = forms.getValues(form);
    dataService.sessionManager(request, regionId, companyId, { address: { addressId: selectedAddress } });
    const redirectPath = selectedAddress === 'new_address' ? 'create-address' : 'add-fao';
    return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/${redirectPath}`);
  }
  return h.postRedirectGet(form, urlJoin('/invoice-accounts/create/', regionId, companyId, 'select-address'));
};

const getFao = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  return h.view('nunjucks/form', {
    ...request.view,
    caption: getCaption(session.viewData.licenceNumber),
    pageTitle: 'Do you need to add an FAO?',
    back: '/manage',
    form: sessionForms.get(request, addFaoForm(request, !!session.contact))
  });
};

const postFao = async (request, h) => {
  const { regionId, companyId } = request.params;
  const schema = addFaoFormSchema(request.payload);
  const form = forms.handleRequest(addFaoForm(request), request, schema);
  if (form.isValid) {
    const { faoRequired } = forms.getValues(form);
    const redirectPath = processFaoFormData(request, regionId, companyId, faoRequired);
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
  const selectedAddress = getSelectedAddress(companyId, session);
  const company = await dataService.getCompany(companyId);
  return h.view('nunjucks/invoice-accounts/check-details', {
    ...request.view,
    form: sessionForms.get(request, checkDetailsForm(request)),
    caption: getCaption(session.viewData.licenceNumber),
    pageTitle: 'Check billing account details',
    back: '/manage',
    session,
    companyId,
    regionId,
    company,
    selectedAddress });
};

const postCheckDetails = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  // TODO default start date added here - might need to create a screen for the user to select a date
  session.startDate = moment().format('YYYY-MM-DD');
  const redirectPath = session.viewData.redirectPath;
  // remove unnecesary session data
  delete session.viewData;
  if (session.address.addressId === tempId) { delete session.address.addressId; };

  const invoiceAcc = await dataService.saveInvoiceAccDetails({ regionId, companyId, ...session });
  request.yar.clear(`newInvoiceAccountFlow.${regionId}.${companyId}`);
  const path = redirectPath + '?' + queryString.stringify({ invoiceAccountId: invoiceAcc.id });
  return h.redirect(path);
};

module.exports.getCompany = getCompany;
module.exports.postCompany = postCompany;

module.exports.getAddress = getAddress;
module.exports.postAddress = postAddress;

module.exports.postFao = postFao;
module.exports.getFao = getFao;

module.exports.getCheckDetails = getCheckDetails;
module.exports.postCheckDetails = postCheckDetails;
