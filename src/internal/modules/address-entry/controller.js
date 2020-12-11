'use strict';

const { omit } = require('lodash');

const forms = require('shared/lib/forms');
const session = require('./lib/session');
const routing = require('./lib/routing');
const { NEW_ADDRESS } = require('./lib/constants');
const addressForms = require('./forms');
const { handleFormRequest } = require('shared/lib/form-handler');

const getDefaultView = request => {
  const { sessionData: { caption, back } } = request.pre;
  return {
    ...request.view,
    back,
    caption
  };
};

/**
 * Search by postcode and display results
 */
const getPostcode = async (request, h) => {
  const { key } = request.params;
  const postcodeForm = handleFormRequest(request, addressForms.ukPostcode);
  const selectAddressForm = handleFormRequest(request, addressForms.selectAddress);

  // If valid postcode, select available addresses
  const isPostcodeSelected = [postcodeForm.isValid, selectAddressForm.isSubmitted].includes(true);
  if (isPostcodeSelected) {
    const { postcode } = forms.getValues(selectAddressForm);

    return h.view('nunjucks/address-entry/select-address', {
      ...getDefaultView(request),
      back: routing.getPostcode(key),
      pageTitle: 'Select the address',
      form: selectAddressForm,
      postcode
    });
  }

  // Otherwise display postcode form
  return h.view('nunjucks/address-entry/enter-uk-postcode', {
    ...getDefaultView(request),
    pageTitle: 'Enter the UK postcode',
    form: postcodeForm
  });
};

/**
 * Post handler for selecting address
 */
const postSelectAddress = (request, h) => {
  const form = handleFormRequest(request, addressForms.selectAddress);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const { key } = request.params;
  const { addressSearchResults } = request.pre;
  const { uprn } = forms.getValues(form);

  const selectedAddress = addressSearchResults.find(address => address.uprn === parseInt(uprn));
  const { redirectPath } = session.merge(request, key, { data: selectedAddress });
  return h.redirect(redirectPath);
};

/**
 * Display manual address entry form
 */
const getManualAddressEntry = (request, h) => h.view('nunjucks/form', {
  ...getDefaultView(request),
  pageTitle: 'Enter the address',
  back: routing.getPostcode(request.params.key, request.query),
  form: handleFormRequest(request, addressForms.manualAddressEntry)
});

/**
 * Post handler for manual address entry form
 */
const postManualAddressEntry = (request, h) => {
  const form = handleFormRequest(request, addressForms.manualAddressEntry);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const data = {
    source: 'wrls',
    uprn: null,
    ...omit(forms.getValues(form), 'csrf_token')
  };

  const { key } = request.params;
  const { redirectPath } = session.merge(request, key, { data });
  return h.redirect(redirectPath);
};

/**
 * Display form to select existing company address
 */
const getSelectCompanyAddress = (request, h) => {
  const form = handleFormRequest(request, addressForms.selectCompanyAddress);

  // If there are no existing addresses redirect to postcode search
  if (request.pre.addresses.length === 0) {
    return h.redirect(routing.getPostcode(request.params.key));
  }

  return h.view('nunjucks/form', {
    ...getDefaultView(request),
    pageTitle: `Select an existing address for ${request.pre.company.name}`,
    form
  });
};

const getAddress = row => row.address;

/**
 * Post handler for select existing company address
 */
const postSelectCompanyAddress = (request, h) => {
  const form = handleFormRequest(request, addressForms.selectCompanyAddress);
  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const { key } = request.params;
  const { selectedAddress } = forms.getValues(form);

  if (selectedAddress === NEW_ADDRESS) {
    return h.redirect(routing.getPostcode(key));
  }

  // Find address in array
  const data = request.pre.addresses
    .map(getAddress)
    .find(row => row.id === selectedAddress);

  // Set address in session and redirect back to parent flow
  const { redirectPath } = session.merge(request, key, { data });
  return h.redirect(redirectPath);
};

/**
 * Display form with registered company address
 */
const getUseRegisteredAddress = (request, h) => h.view('nunjucks/address-entry/use-registered-address', {
  ...getDefaultView(request),
  pageTitle: `Registered office address`,
  form: handleFormRequest(request, addressForms.useRegisteredAddress),
  address: request.pre.company.address
});

/**
 * Post handler for registered company address form
 */
const postUseRegisteredAddress = (request, h) => {
  const form = handleFormRequest(request, addressForms.useRegisteredAddress);
  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const { key } = request.params;
  const { useRegisteredAddress } = forms.getValues(form);

  if (useRegisteredAddress) {
    // Set address in session and redirect back to parent flow
    const { redirectPath } = session.merge(request, key, { data: request.pre.company.address });
    return h.redirect(redirectPath);
  }

  // Set a custom address instead
  return h.redirect(routing.getPostcode(key));
};

exports.getPostcode = getPostcode;
exports.postSelectAddress = postSelectAddress;

exports.getManualAddressEntry = getManualAddressEntry;
exports.postManualAddressEntry = postManualAddressEntry;

exports.getSelectCompanyAddress = getSelectCompanyAddress;
exports.postSelectCompanyAddress = postSelectCompanyAddress;

exports.getUseRegisteredAddress = getUseRegisteredAddress;
exports.postUseRegisteredAddress = postUseRegisteredAddress;
