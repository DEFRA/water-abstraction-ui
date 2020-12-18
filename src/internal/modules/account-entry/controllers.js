const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const { selectAccountType, companySearch, companySearchSelectCompany, companySearchSelectAddress } = require('./forms');
const sessionHelper = require('shared/lib/session-helpers');
const queryString = require('querystring');
const { SESSION_KEY: ADDRESS_FLOW_SESSION_KEY } = require('../address-entry/plugin');

const getNew = async (request, h) => {
  const { sessionKey, regionId, originalCompanyId, back, searchQuery, redirectPath } = request.query;
  // First, store the licence ID in the session, for use in captions
  await sessionHelper.saveToSession(request, sessionKey, {
    redirectPath,
    back,
    regionId,
    originalCompanyId,
    searchQuery
  });
  return h.redirect(`/contact-entry/new/account-type?sessionKey=${sessionKey}`);
};

const getSelectAccountTypeController = async (request, h) => {
  const { sessionKey } = request.query;
  const { back, accountType, personName, searchQuery } = await sessionHelper.saveToSession(request, sessionKey);
  // Return the view
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Select the account type',
    back: back,
    form: sessionForms.get(request, selectAccountType.form(request, accountType, personName || searchQuery))
  });
};

const postSelectAccountTypeController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { accountType, personName } = request.payload;
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
    sessionHelper.saveToSession(request, sessionKey, { newCompany: true, accountType, personFullName: personName, companyName: personName, agent: { companyId: '00000000-0000-0000-0000-000000000000', name: personName } });
    return h.redirect(`/contact-entry/new/details?sessionKey=${sessionKey}`);
  }
};

const getDetailsController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { companyNameOrNumber, searchQuery, accountType } = await sessionHelper.saveToSession(request, sessionKey);

  if (accountType === 'organisation') { // For companies, the next step is companies house
    const defaultValue = companyNameOrNumber || searchQuery;

    return h.view('nunjucks/form', {
      ...request.view,
      pageTitle: 'Enter the company details',
      back: `/contact-entry/new/account-type?sessionKey=${sessionKey}`,
      form: sessionForms.get(request, companySearch.form(request, defaultValue))
    });
  } else { // For individuals, we hand over to the address entry flow
    const queryTail = queryString.stringify({
      redirectPath: `/contact-entry/new/address-entered?sessionKey=${sessionKey}`,
      back: `/contact-entry/new/details?sessionKey=${sessionKey}`
    });
    return h.redirect(`/address-entry/postcode?${queryTail}`);
  }
};

const getAddressEntered = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  // Fetch the address using the address flow session key
  //  const address = await sessionHelper.saveToSession(request, ADDRESS_FLOW_SESSION_KEY);
  const address = request.yar.get(ADDRESS_FLOW_SESSION_KEY);

  const { redirectPath } = await sessionHelper.saveToSession(request, sessionKey, {
    address: {
      ...address,
      addressId: '00000000-0000-0000-0000-000000000000',
      id: '00000000-0000-0000-0000-000000000000'
    }
  });

  // Redirect the user to the referring workflow
  return h.redirect(redirectPath);
};

const postCompanySearchController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
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
    sessionHelper.saveToSession(request, sessionKey, { companyNameOrNumber });
    // Proceed to the next stage - Goes to the address entry workflow
    return h.redirect(`/contact-entry/new/details/company-search/select-company?sessionKey=${sessionKey}`);
  }
};

const getSelectCompanyController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { selectedCompaniesHouseNumber, companyNameOrNumber } = await sessionHelper.saveToSession(request, sessionKey);

  return h.view('nunjucks/contact-entry/select-company', {
    ...request.view,
    pageTitle: 'Select the registered company details',
    companyNameOrNumber,
    sessionKey,
    back: `/contact-entry/new/details?sessionKey=${sessionKey}`,
    form: sessionForms.get(request, companySearchSelectCompany.form(request, selectedCompaniesHouseNumber))
  });
};

const postSelectCompanyController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
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
    const selectedCompanyName = request.pre.companiesHouseResults.find(x => x.company.companyNumber === selectedCompaniesHouseNumber).company.name;
    // Company name or number has been set. Store this in the session
    sessionHelper.saveToSession(request, sessionKey, {
      selectedCompaniesHouseNumber,
      companyName: selectedCompanyName,
      selectedCompaniesHouseCompanyName: selectedCompanyName,
      organisationType: request.pre.companiesHouseResults.find(x => x.company.companyNumber === selectedCompaniesHouseNumber).company.organisationType,
      agent: { companyId: '00000000-0000-0000-0000-000000000000', name: selectedCompanyName }
    });
    // Proceed to the next stage
    return h.redirect(`/contact-entry/new/details/company-search/select-company-address?sessionKey=${sessionKey}`);
  }
};

const getSelectCompanyAddressController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { defaultValue } = await sessionHelper.saveToSession(request, sessionKey);
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Select a company address',
    back: `/contact-entry/new/details/company-search/select-company?sessionKey=${sessionKey}`,
    form: sessionForms.get(request, companySearchSelectAddress.form(request, defaultValue))
  });
};

const postSelectCompanyAddressController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;

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
    const { redirectPath } = await sessionHelper.saveToSession(request, sessionKey, {
      address: {
        ...JSON.parse(selectedCompaniesHouseAddress),
        addressId: '00000000-0000-0000-0000-000000000000',
        id: '00000000-0000-0000-0000-000000000000'
      }
    });
    // Redirect the user back into the invoice-accounts flow
    return h.redirect(`${redirectPath}`);
  }
};

exports.getNew = getNew;
exports.getSelectAccountTypeController = getSelectAccountTypeController;
exports.postSelectAccountTypeController = postSelectAccountTypeController;
exports.getDetailsController = getDetailsController;
exports.getAddressEntered = getAddressEntered;
exports.postCompanySearchController = postCompanySearchController;
exports.getSelectCompanyController = getSelectCompanyController;
exports.postSelectCompanyController = postSelectCompanyController;
exports.getSelectCompanyAddressController = getSelectCompanyAddressController;
exports.postSelectCompanyAddressController = postSelectCompanyAddressController;
