const sessionForms = require('shared/lib/session-forms');
const { merge } = require('lodash');
const forms = require('shared/lib/forms');
const { selectContact, selectAddress, selectAccountType, companySearch, personName, companySearchSelectCompany, companySearchSelectAddress } = require('./forms');
const queryString = require('querystring');
const ADDRESS_FLOW_SESSION_KEY = require('../address-entry/plugin').SESSION_KEY;

const getSelectAddressController = (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
  let defaultValue = currentState.addressId;
  return h.view('nunjucks/contact-entry/basic-form', {
    ...request.view,
    pageTitle: `Select an address`,
    back: request.query.back,
    form: sessionForms.get(request, selectAddress.form(request, defaultValue))
  });
};

const postSelectAddressController = (request, h) => {
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
    // Contact has been selected. Store the contact ID in yar
    let currentState = request.yar.get(sessionKey);
    request.yar.set(sessionKey, merge(currentState, { addressId: id, address: null }));
    // Redirect the user back into the invoice-accounts flow
    return h.redirect(`/invoice-accounts/create/${currentState.regionId}/${currentState.originalCompanyId}/contact-entry-complete?sessionKey=${sessionKey}`);
  }
};

const getSelectContactController = (request, h) => {
  const { sessionKey, regionId, originalCompanyId, back, searchQuery } = request.query;
  // First, store the licence ID in the session, for use in captions

  let currentState = request.yar.get(sessionKey);
  request.yar.set(sessionKey, merge(currentState, {
    back,
    regionId,
    originalCompanyId,
    searchQuery
  }));

  let defaultValue = currentState ? currentState.id : null;

  // Return the view
  return h.view('nunjucks/contact-entry/basic-form', {
    ...request.view,
    pageTitle: 'Does this contact already exist?',
    form: sessionForms.get(request, selectContact.form(request, defaultValue))
  });
};

const getSelectAccountTypeController = (request, h) => {
  const { sessionKey } = request.query;
  let currentState = request.yar.get(sessionKey);
  let defaultValue = currentState.accountType;
  return h.view('nunjucks/contact-entry/basic-form', {
    ...request.view,
    pageTitle: 'Select the account type',
    form: sessionForms.get(request, selectAccountType.form(request, defaultValue))
  });
};

const postSelectAccountTypeController = (request, h) => {
  const { sessionKey } = request.payload || request.query;

  let currentState = request.yar.get(sessionKey);
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
    request.yar.set(sessionKey, merge(currentState, { newCompany: true, accountType }));
    // Proceed to the next stage
    return h.redirect(`/contact-entry/new/details?sessionKey=${sessionKey}`);
  }
};

const postSelectContactController = (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
  const { id, searchQuery, regionId } = request.payload;
  if (id === null || id === 'new') {
    return h.redirect(`/contact-entry/new/account-type?sessionKey=${sessionKey}`);
  } else {
    const form = forms.handleRequest(selectContact.form(request), request, selectContact.schema);
    if (!form.isValid) {
      return h.postRedirectGet(form, '/contact-entry/select-contact', {
        sessionKey,
        back: currentState.back,
        regionId,
        searchQuery
      });
    } else {
      // Contact has been selected. Store the contact ID in yar
      request.yar.set(sessionKey, merge(currentState, {
        newCompany: false,
        id: id,
        companyName: request.pre.contactSearchResults.find(x => x.id === id).name
      }));
      return h.redirect(`/contact-entry/select-address?sessionKey=${sessionKey}`);
    }
  }
};

const postDetailsController = (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
  let defaultValue;
  if (currentState.accountType === 'organisation') {
    defaultValue = currentState.companyNameOrNumber ? currentState.companyNameOrNumber : currentState.searchQuery;
  } else {
    defaultValue = currentState.personName ? currentState.personName : currentState.searchQuery;
  }
  return h.view('nunjucks/contact-entry/basic-form', {
    ...request.view,
    pageTitle: currentState.accountType === 'organisation' ? 'Enter the company details' : 'Enter the full name',
    back: request.query.back,
    form: currentState.accountType === 'organisation' ? sessionForms.get(request, companySearch.form(request, defaultValue)) : sessionForms.get(request, personName.form(request, defaultValue))
  });
};

const postPersonDetailsController = (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
  const { personFullName } = request.payload;
  const form = forms.handleRequest(
    personName.form(request),
    request,
    personName.schema
  );
  // If form is invalid, redirect user back to form
  if (!form.isValid) {
    return h.postRedirectGet(form, '/contact-entry/new/details', {
      sessionKey
    });
  } else {
    // Contact name has been set. Store the contact name in yar
    request.yar.set(sessionKey, merge(currentState, { personFullName, companyName: personFullName }));
    // Proceed to the next stage
    // Goes to the address entry workflow
    const queryTail = queryString.stringify({
      redirectPath: `/contact-entry/new/details/after-address-entry?sessionKey=${sessionKey}`,
      back: `/contact-entry/new/details?sessionKey=${sessionKey}`
    });
    return h.redirect(`/address-entry/postcode?${queryTail}`);
  }
};

const postCompanySearchController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
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
    request.yar.set(sessionKey, merge(currentState, { companyNameOrNumber }));
    // Proceed to the next stage
    // Goes to the address entry workflow
    // TODO: Fetch companies from companies house
    return h.redirect(`/contact-entry/new/details/company-search/select-company?sessionKey=${sessionKey}`);
  }
};

const postSelectCompanyAddressController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
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
    request.yar.set(sessionKey, merge(currentState, {
      addressId: null, address: JSON.parse(selectedCompaniesHouseAddress)
    }));
    // Redirect the user back into the invoice-accounts flow
    return h.redirect(`/invoice-accounts/create/${currentState.regionId}/${currentState.originalCompanyId}/contact-entry-complete?sessionKey=${sessionKey}`);
  }
};

const getSelectCompanyAddressController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
  let defaultValue = currentState.selectedCompaniesHouseAddress;
  return h.view('nunjucks/contact-entry/basic-form', {
    ...request.view,
    pageTitle: 'Select a company address',
    back: request.query.back,
    form: sessionForms.get(request, companySearchSelectAddress.form(request, defaultValue))
  });
};

const postSelectCompanyController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
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
    let selectedCompanyName = request.pre.companiesHouseResults.find(x => x.company.companyNumber === selectedCompaniesHouseNumber).company.name;
    // Company name or number has been set. Store this in yar
    request.yar.set(sessionKey, merge(currentState, {
      selectedCompaniesHouseNumber,
      companyName: selectedCompanyName,
      selectedCompaniesHouseCompanyName: selectedCompanyName,
      organisationType: request.pre.companiesHouseResults.find(x => x.company.companyNumber === selectedCompaniesHouseNumber).company.organisationType
    }));
    // Proceed to the next stage
    return h.redirect(`/contact-entry/new/details/company-search/select-company-address?sessionKey=${sessionKey}`);
  }
};

const getSelectCompanyController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
  let defaultValue = currentState.selectedCompaniesHouseNumber;

  return h.view('nunjucks/contact-entry/basic-form', {
    ...request.view,
    pageTitle: 'Select a company',
    back: request.query.back,
    form: sessionForms.get(request, companySearchSelectCompany.form(request, defaultValue))
  });
};

const getAfterAddressEntryController = (request, h) => {
  // This is the path the user is redirected to after the address entry flow
  // Sets the address in the yar object
  const { sessionKey } = request.payload || request.query;
  let currentState = request.yar.get(sessionKey);
  let address = request.yar.get(ADDRESS_FLOW_SESSION_KEY);
  request.yar.set(sessionKey, merge(currentState, { addressId: null, address }));
  // Redirect the user back into the invoice-accounts flow
  return h.redirect(`/invoice-accounts/create/${currentState.regionId}/${currentState.originalCompanyId}/contact-entry-complete?sessionKey=${sessionKey}`);
};

exports.getSelectAddressController = getSelectAddressController;
exports.postSelectAddressController = postSelectAddressController;
exports.getSelectContactController = getSelectContactController;
exports.getSelectAccountTypeController = getSelectAccountTypeController;
exports.postSelectAccountTypeController = postSelectAccountTypeController;
exports.postSelectContactController = postSelectContactController;
exports.postDetailsController = postDetailsController;
exports.postPersonDetailsController = postPersonDetailsController;
exports.postCompanySearchController = postCompanySearchController;
exports.postSelectCompanyAddressController = postSelectCompanyAddressController;
exports.getSelectCompanyAddressController = getSelectCompanyAddressController;
exports.postSelectCompanyController = postSelectCompanyController;
exports.getSelectCompanyController = getSelectCompanyController;
exports.getAfterAddressEntryController = getAfterAddressEntryController;
