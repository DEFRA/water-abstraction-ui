const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const { selectContact, selectAccountType, companySearch, companySearchSelectCompany, companySearchSelectAddress } = require('./forms');
const queryString = require('querystring');
const sessionHelper = require('shared/lib/session-helpers');
const ADDRESS_FLOW_SESSION_KEY = require('../address-entry/plugin').SESSION_KEY;

const getSelectContactController = async (request, h) => {
  const { sessionKey, regionId, originalCompanyId, back, searchQuery } = request.query;
  // First, store the licence ID in the session, for use in captions
  const { id } = await sessionHelper.saveToSession(request, sessionKey, {
    back,
    regionId,
    originalCompanyId,
    searchQuery
  });

  // Return the view
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Does this contact already exist?',
    back: back,
    form: sessionForms.get(request, selectContact.form(request, id))
  });
};

const postSelectContactController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { back } = await sessionHelper.saveToSession(request, sessionKey);
  const { id, searchQuery, regionId, originalCompanyId } = request.payload;
  if (id === null || id === 'new') {
    return h.redirect(`/contact-entry/new/account-type?sessionKey=${sessionKey}`);
  } else {
    const form = forms.handleRequest(selectContact.form(request), request, selectContact.schema);
    if (!form.isValid) {
      return h.postRedirectGet(form, '/contact-entry/select-contact', {
        sessionKey,
        searchQuery,
        regionId,
        originalCompanyId,
        back: back
      });
    } else {
      // Contact has been selected. Store the contact ID in yar
      sessionHelper.saveToSession(request, sessionKey, {
        newCompany: false,
        id: id,
        companyName: request.pre.contactSearchResults.find(x => x.id === id).name
      });
      // Redirect to address entry next
      const queryTail = queryString.stringify({
        redirectPath: `/contact-entry/new/details/after-address-entry?sessionKey=${sessionKey}`,
        back: `/contact-entry/new/details?sessionKey=${sessionKey}`
      });
      return h.redirect(`/address-entry/postcode?${queryTail}`);
    }
  }
};

const getSelectAccountTypeController = async (request, h) => {
  const { sessionKey } = request.query;
  const { accountType, personName, searchQuery } = await sessionHelper.saveToSession(request, sessionKey);
  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Select the account type',
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
    sessionHelper.saveToSession(request, sessionKey, { newCompany: true, accountType, personFullName: personName, companyName: personName });

    // Proceed to the next stage
    if (accountType === 'organisation') {
      return h.redirect(`/contact-entry/new/details?sessionKey=${sessionKey}`);
    } else {
      // Goes to the address entry workflow
      const queryTail = queryString.stringify({
        redirectPath: `/contact-entry/new/details/after-address-entry?sessionKey=${sessionKey}`,
        back: `/contact-entry/new/details?sessionKey=${sessionKey}`
      });
      return h.redirect(`/address-entry/postcode?${queryTail}`);
    }
  }
};

const getDetailsController = async (request, h) => {
  const { sessionKey } = request.payload || request.query;
  const { companyNameOrNumber, searchQuery } = await sessionHelper.saveToSession(request, sessionKey);

  const defaultValue = companyNameOrNumber || searchQuery;

  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle: 'Enter the company details',
    back: request.query.back,
    form: sessionForms.get(request, companySearch.form(request, defaultValue))
  });
};

const getAfterAddressEntryController = async (request, h) => {
  // This is the path the user is redirected to after the address entry flow
  // Sets the address in the yar object
  const { sessionKey } = request.payload || request.query;
  const { back } = await sessionHelper.saveToSession(request, sessionKey, { addressId: null, address: null });
  const address = await sessionHelper.saveToSession(request, ADDRESS_FLOW_SESSION_KEY);
  sessionHelper.saveToSession(request, sessionKey, { addressId: null, address });
  // Redirect the user back into the referring flow
  return h.redirect(`${back}?sessionKey=${sessionKey}`);
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
  const { selectedCompaniesHouseNumber } = await sessionHelper.saveToSession(request, sessionKey);

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
  const { defaultValue } = await sessionHelper.saveToSession(request, sessionKey);
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
    const { back } = await sessionHelper.saveToSession(request, sessionKey, { addressId: null, address: JSON.parse(selectedCompaniesHouseAddress) });
    // Redirect the user back into the invoice-accounts flow
    return h.redirect(`${back}?sessionKey=${sessionKey}`);
  }
};

exports.getSelectContactController = getSelectContactController;
exports.postSelectContactController = postSelectContactController;
exports.getSelectAccountTypeController = getSelectAccountTypeController;
exports.postSelectAccountTypeController = postSelectAccountTypeController;
exports.getDetailsController = getDetailsController;
exports.getAfterAddressEntryController = getAfterAddressEntryController;
exports.postCompanySearchController = postCompanySearchController;
exports.getSelectCompanyController = getSelectCompanyController;
exports.postSelectCompanyController = postSelectCompanyController;
exports.getSelectCompanyAddressController = getSelectCompanyAddressController;
exports.postSelectCompanyAddressController = postSelectCompanyAddressController;
