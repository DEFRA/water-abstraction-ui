const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const { selectContact, selectAddress, selectAccountType, companySearch, personNameInput, companySearchSelectCompany, companySearchSelectAddress } = require('./forms');
const queryString = require('querystring');
const sessionHelper = require('shared/lib/session-helpers');
const ADDRESS_FLOW_SESSION_KEY = require('../address-entry/plugin').SESSION_KEY;

const getSelectContactController = async (request, h) => {
  const { sessionKey, regionId, originalCompanyId, back, searchQuery } = request.query;
  // First, store the licence ID in the session, for use in captions
  const { id } = sessionHelper.saveToSession(request, sessionKey, {
    back,
    regionId,
    originalCompanyId,
    searchQuery
  });

  // Return the view
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Does this contact already exist?',
    form: sessionForms.get(request, selectContact.form(request, id))
  });
};

const postSelectContactController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { back } = sessionHelper.saveToSession(request, sessionKey);
  const { id, searchQuery, regionId } = request.payload;
  if (id === null || id === 'new') {
    return h.redirect(`/contact-entry/new/account-type?sessionKey=${sessionKey}`);
  } else {
    const form = forms.handleRequest(selectContact.form(request), request, selectContact.schema);
    if (!form.isValid) {
      return h.postRedirectGet(form, '/contact-entry/select-contact', {
        sessionKey,
        back: back,
        regionId,
        searchQuery
      });
    } else {
      // Contact has been selected. Store the contact ID in yar
      sessionHelper.saveToSession(request, sessionKey, {
        newCompany: false,
        id: id,
        companyName: request.pre.contactSearchResults.find(x => x.id === id).name
      });
      return h.redirect(`/contact-entry/select-address?sessionKey=${sessionKey}`);
    }
  }
};

const getSelectAccountTypeController = async (request, h) => {
  const { sessionKey } = request.query;
  const { accountType } = sessionHelper.saveToSession(request, sessionKey);
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Select the account type',
    form: sessionForms.get(request, selectAccountType.form(request, accountType))
  });
};

const postSelectAccountTypeController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
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
    sessionHelper.saveToSession(request, sessionKey, { newCompany: true, accountType });
    // Proceed to the next stage
    return h.redirect(`/contact-entry/new/details?sessionKey=${sessionKey}`);
  }
};

const getDetailsController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { accountType, companyNameOrNumber, searchQuery, personName } = sessionHelper.saveToSession(request, sessionKey);
  let defaultValue;
  if (accountType === 'organisation') {
    defaultValue = companyNameOrNumber || searchQuery;
  } else {
    defaultValue = personName || searchQuery;
  }
  const form = accountType === 'organisation' ? sessionForms.get(request, companySearch.form(request, defaultValue)) : sessionForms.get(request, personNameInput.form(request, defaultValue));
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: accountType === 'organisation' ? 'Enter the company details' : 'Enter the full name',
    back: request.query.back,
    form: form
  });
};

const postPersonDetailsController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { personFullName } = request.payload;
  const form = forms.handleRequest(
    personNameInput.form(request),
    request,
    personNameInput.schema
  );
  // If form is invalid, redirect user back to form
  if (!form.isValid) {
    return h.postRedirectGet(form, '/contact-entry/new/details', {
      sessionKey
    });
  } else {
    // Contact name has been set. Store the contact name in yar
    sessionHelper.saveToSession(request, sessionKey, { personFullName, companyName: personFullName });
    // Proceed to the next stage
    // Goes to the address entry workflow
    const queryTail = queryString.stringify({
      redirectPath: `/contact-entry/new/details/after-address-entry?sessionKey=${sessionKey}`,
      back: `/contact-entry/new/details?sessionKey=${sessionKey}`
    });
    return h.redirect(`/address-entry/postcode?${queryTail}`);
  }
};

const getAfterAddressEntryController = async (request, h) => {
  // This is the path the user is redirected to after the address entry flow
  // Sets the address in the yar object
  const { sessionKey } = request.payload || request.query;
  const { regionId, originalCompanyId } = sessionHelper.saveToSession(request, sessionKey, { addressId: null, address: null });
  const address = sessionHelper.saveToSession(request, ADDRESS_FLOW_SESSION_KEY);
  sessionHelper.saveToSession(request, sessionKey, { addressId: null, address });
  // Redirect the user back into the invoice-accounts flow
  return h.redirect(`/invoice-accounts/create/${regionId}/${originalCompanyId}/contact-entry-complete?sessionKey=${sessionKey}`);
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
  const { selectedCompaniesHouseNumber } = sessionHelper.saveToSession(request, sessionKey);

  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Select a company',
    back: request.query.back,
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
      organisationType: request.pre.companiesHouseResults.find(x => x.company.companyNumber === selectedCompaniesHouseNumber).company.organisationType
    });
    // Proceed to the next stage
    return h.redirect(`/contact-entry/new/details/company-search/select-company-address?sessionKey=${sessionKey}`);
  }
};

const getSelectCompanyAddressController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { defaultValue } = sessionHelper.saveToSession(request, sessionKey);
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Select a company address',
    back: request.query.back,
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
    const { regionId, originalCompanyId } = sessionHelper.saveToSession(request, sessionKey, { addressId: null, address: JSON.parse(selectedCompaniesHouseAddress) });
    // Redirect the user back into the invoice-accounts flow
    return h.redirect(`/invoice-accounts/create/${regionId}/${originalCompanyId}/contact-entry-complete?sessionKey=${sessionKey}`);
  }
};

const getSelectAddressController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { defaultValue } = sessionHelper.saveToSession(request, sessionKey);
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: `Select an address`,
    back: request.query.back,
    form: sessionForms.get(request, selectAddress.form(request, defaultValue))
  });
};

const postSelectAddressController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { id } = request.payload;
  const form = forms.handleRequest(
    selectAddress.form(request),
    request,
    selectAddress.schema
  );
  // If form is invalid, redirect user back to form
  if (!form.isValid) {
    return h.postRedirectGet(form, '/contact-entry/select-address', {
      sessionKey
    });
  } else if (id === 'new') {
    // Redirect to path for creating a new address (Dana's flow)
    const queryTail = queryString.stringify({
      redirectPath: `/contact-entry/new/details/after-address-entry?sessionKey=${sessionKey}`,
      back: `/contact-entry/new/details?sessionKey=${sessionKey}`
    });
    return h.redirect(`/address-entry/postcode?${queryTail}`);
  } else {
    // Address has been selected. Store the address ID in yar
    const { regionId, originalCompanyId } = sessionHelper.saveToSession(request, sessionKey, { addressId: id, address: null });
    // Redirect the user back into the invoice-accounts flow
    return h.redirect(`/invoice-accounts/create/${regionId}/${originalCompanyId}/contact-entry-complete?sessionKey=${sessionKey}`);
  }
};

exports.getSelectContactController = getSelectContactController;
exports.postSelectContactController = postSelectContactController;
exports.getSelectAccountTypeController = getSelectAccountTypeController;
exports.postSelectAccountTypeController = postSelectAccountTypeController;
exports.getDetailsController = getDetailsController;
exports.postPersonDetailsController = postPersonDetailsController;
exports.getAfterAddressEntryController = getAfterAddressEntryController;
exports.postCompanySearchController = postCompanySearchController;
exports.getSelectCompanyController = getSelectCompanyController;
exports.postSelectCompanyController = postSelectCompanyController;
exports.getSelectCompanyAddressController = getSelectCompanyAddressController;
exports.postSelectCompanyAddressController = postSelectCompanyAddressController;
exports.getSelectAddressController = getSelectAddressController;
exports.postSelectAddressController = postSelectAddressController;
