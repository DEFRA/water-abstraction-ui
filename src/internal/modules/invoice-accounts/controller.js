'use-strict';
const boom = require('@hapi/boom');
const queryString = require('querystring');
const moment = require('moment');
const sessionForms = require('shared/lib/session-forms');
const { selectCompanyForm, selectCompanyFormSchema } = require('./forms/select-company');
const { selectAddressForm, selectAddressFormSchema } = require('./forms/select-address');
const { addFaoForm, addFaoFormSchema } = require('./forms/add-fao');
const forms = require('shared/lib/forms');
const tempId = '00000000-0000-0000-0000-000000000000';
const dataService = require('./lib/data-service');

const getCompany = async (request, h) => {
  const { regionId, companyId } = request.params;
  const { licenceId, redirectPath } = request.query;
  const { licenceNumber } = licenceId ? await dataService.getLicenceById(licenceId) : { licenceNumber: null };
  const company = await dataService.getCompany(companyId);
  // The company name and licence number set here will be used in the select address page
  const data = { regionId, companyId, viewData: { redirectPath, licenceNumber, companyName: company.name } };
  const session = dataService.sessionManager(request, regionId, companyId, data);
  const selectedCompany = session.agent ? await dataService.getCompany(session.agent) : company;
  if (session.licenceNumber) { request.view.caption = `Licence ${session.licenceNumber}`; };
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Who should the bills go to?',
    back: '/manage',
    form: sessionForms.get(request, selectCompanyForm(request, company, selectedCompany))
  });
};

const processCompanyFormData = (request, regionId, companyId, formData) => {
  const { selectedCompany, companySearch } = forms.getValues(formData);
  if (selectedCompany === 'company_search') {
    // TODO place holder -- route does not exist
    return `company-search?filter=${companySearch}`;
  } else {
    const agentId = selectedCompany === companyId ? null : selectedCompany;
    dataService.sessionManager(request, regionId, companyId, { agent: agentId });
    return 'select-address';
  }
};

const postCompany = async (request, h) => {
  const { regionId, companyId } = request.payload;
  const company = await dataService.getCompany(companyId);
  const schema = selectCompanyFormSchema(request.payload);
  const form = forms.handleRequest(selectCompanyForm(request, company, company), request, schema);
  if (form.isValid) {
    const redirectPath = processCompanyFormData(request, regionId, companyId, form);
    return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/${redirectPath}`);
  }
  const { redirectPath } = dataService.sessionManager(request, regionId, companyId);
  return h.postRedirectGet(form, `/invoice-accounts/create/${regionId}/${companyId}`, { redirectPath });
};

const getAddress = async (request, h) => {
  const { regionId, companyId } = request.params;
  const addresses = await dataService.getCompanyAddresses(companyId);
  const session = dataService.sessionManager(request, regionId, companyId);
  // @TODO this might need a mapper to map the session address data to the Company address shape passed to the form
  if (session.address && session.address.addressId === tempId) { addresses.push(session.address); }
  if (session.licenceNumber) { request.view.caption = `Licence ${session.view.licenceNumber}`; };
  const selectedAddress = session.address ? session.address.addressId : null;
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: `Select an existing address for ${session.viewData.companyName}`,
    back: '/manage',
    form: sessionForms.get(request, selectAddressForm(request, addresses, selectedAddress))
  });
};

const postAddress = async (request, h) => {
  const { selectedAddress, regionId, companyId } = request.payload;
  const addresses = await dataService.getCompanyAddresses(companyId);
  const schema = selectAddressFormSchema(request.payload);
  const form = forms.handleRequest(selectAddressForm(request, addresses), request, schema);
  if (form.isValid) {
    dataService.sessionManager(request, regionId, companyId, { address: { addressId: selectedAddress } });
    const redirectPath = selectedAddress === 'new_address' ? 'create-address' : 'add-fao';
    return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/${redirectPath}`);
  }
  return h.postRedirectGet(form, `/invoice-accounts/create/${regionId}/${companyId}/select-address`);
};

const getFao = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  if (session.licenceNumber) { request.view.caption = `Licence ${session.licenceNumber}`; };
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Do you need to add an FAO?',
    back: '/manage',
    form: sessionForms.get(request, addFaoForm(request, !!session.contact))
  });
};

const processFaoFormData = (request, regionId, companyId, addFao) => {
  if (addFao === 'yes') {
    // TODO path does not exist
    return 'select-fao';
  } else {
    dataService.sessionManager(request, regionId, companyId, { contact: null });
    return 'check-details';
  }
};

const postFao = async (request, h) => {
  const { regionId, companyId } = request.payload;
  const schema = addFaoFormSchema(request.payload);
  const form = forms.handleRequest(addFaoForm(request), request, schema);
  if (form.isValid) {
    const { faoRequired } = forms.getValues(form);
    const redirectPath = processFaoFormData(request, regionId, companyId, faoRequired);
    return h.redirect(`/invoice-accounts/create/${regionId}/${companyId}/${redirectPath}`);
  }
  return h.postRedirectGet(form, `/invoice-accounts/create/${regionId}/${companyId}/add-fao`);
};

const getDetails = async (request, h) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  if (Object.keys(session).length === 0 && session.constructor === Object) {
    throw boom.notFound('Session data not found');
  }
  const [ company, addresses ] = await Promise.all([
    dataService.getCompany(companyId),
    dataService.getCompanyAddresses(companyId)
  ]);
  const [ address ] = addresses.filter(address => (address.addressId = session.address.addressId));
  if (session.licenceNumber) { request.view.caption = `Licence ${session.licenceNumber}`; };
  return h.view('nunjucks/invoice-accounts/check-details', {
    ...request.view, pageTitle: 'Check billing account details', session, companyId, regionId, company, address });
};

const postDetails = async (request, h) => {
  const { regionId, companyId } = request.payload;
  const session = dataService.sessionManager(request, regionId, companyId);
  // TODO default start date added here - might need to create a screen for the user to select a date
  session.startDate = moment().format('YYYY-MM-DD');
  const redirectPath = session.viewData.redirectPath;
  // remove no longer needed session data
  delete session.viewData;

  const invoiceAcc = await dataService.saveInvoiceAccDetails(session);
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

module.exports.getDetails = getDetails;
module.exports.postDetails = postDetails;
