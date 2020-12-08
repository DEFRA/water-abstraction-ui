'use strict';

const { omit } = require('lodash');

const forms = require('shared/lib/forms');
const session = require('./lib/session');
const routing = require('./lib/routing');

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
  const { postcodeForm, selectAddressForm } = request.pre;

  // If valid postcode, select available addresses
  if (postcodeForm.isValid || selectAddressForm.isSubmitted) {
    const { postcode } = forms.getValues(selectAddressForm);

    return h.view('nunjucks/address-entry/select-address', {
      ...getDefaultView(request),
      back: request.path,
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
  const { key } = request.params;
  const { addressSearchResults } = request.pre;
  const { uprn } = forms.getValues(request.pre.selectAddressForm);

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
  form: request.pre.form
});

/**
 * Post handler for manual address entry form
 */
const postManualAddressEntry = (request, h) => {
  const { key } = request.params;

  const data = {
    source: 'wrls',
    ...omit(forms.getValues(request.pre.form), 'csrf_token')
  };

  const { redirectPath } = session.merge(request, key, { data });
  return h.redirect(redirectPath);
};

/**
 * Display form to select existing company address
 * @todo handle redirect if there are no addresses for this company
 */
const getSelectCompanyAddress = (request, h) => {
  // If there are no existing addresses redirect to postcode search
  if (request.pre.addresses.length === 0) {
    return h.redirect(routing.getPostcode(request.params.key));
  }

  return h.view('nunjucks/form', {
    ...getDefaultView(request),
    pageTitle: `Select an existing address for ${request.pre.company.name}`,
    form: request.pre.form
  });
};

const getAddress = row => row.address;

/**
 * Post handler for select existing company address
 */
const postSelectCompanyAddress = (request, h) => {
  const { key } = request.params;

  const { selectedAddress } = forms.getValues(request.pre.form);

  if (selectedAddress === 'new_address') {
    return h.redirect(routing.getPostcode(request.params.key));
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
  form: request.pre.form,
  address: request.pre.company.address
});

/**
 * Post handler for registered company address form
 */
const postUseRegisteredAddress = (request, h) => {
  const { key } = request.params;

  const { useRegisteredAddress } = forms.getValues(request.pre.form);

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
