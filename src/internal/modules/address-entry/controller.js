'use strict';

const { omit } = require('lodash');

const { ukPostcode, selectAddress, manualAddressEntry } = require('./forms');
const forms = require('shared/lib/forms');
const session = require('./lib/session');
const routing = require('./lib/routing');

const sessionForms = require('shared/lib/session-forms');

const getDefaultView = request => {
  const { sessionData: { caption, back } } = request.pre;
  return {
    ...request.view,
    back,
    caption
  };
};

const getPostcode = async (request, h, form) => {
  // Create and handle postcode form
  const postcodeForm = forms.handleRequest(
    ukPostcode.form(request),
    request,
    ukPostcode.schema
  );

  // If valid postcode, select available addresses
  if (postcodeForm.isValid) {
    return h.view('nunjucks/address-entry/select-address', {
      ...getDefaultView(request),
      back: request.path,
      pageTitle: 'Select the address',
      form: sessionForms.get(request, selectAddress.form(request)),
      ...forms.getValues(postcodeForm)
    });
  }

  // Otherwise display postcode form
  return h.view('nunjucks/address-entry/enter-uk-postcode', {
    ...getDefaultView(request),
    pageTitle: 'Enter the UK postcode',
    form: postcodeForm
  });
};

const postSelectAddress = (request, h) => {
  const { key } = request.params;
  const { postcode, uprn } = request.payload;
  const { addressSearchResults } = request.pre;
  const form = forms.handleRequest(
    selectAddress.form(request, uprn),
    request,
    selectAddress.schema
  );

  if (form.isValid) {
    const selectedAddress = addressSearchResults.find(address => address.uprn === parseInt(uprn));
    const { redirectPath } = session.merge(request, key, { data: selectedAddress });
    return h.redirect(redirectPath);
  }

  return h.postRedirectGet(form, `/address-entry/${key}/postcode`, { postcode });
};

const getManualAddressEntry = (request, h) => h.view('nunjucks/form', {
  ...getDefaultView(request),
  pageTitle: 'Enter the address',
  back: routing.getPostcode(request),
  form: sessionForms.get(request, manualAddressEntry.form(request, request.getNewAddress(false)))
});

const postManualAddressEntry = (request, h) => {
  const { key } = request.params;

  const form = forms.handleRequest(
    manualAddressEntry.form(request, request.payload),
    request,
    manualAddressEntry.schema
  );

  if (form.isValid) {
    const data = {
      source: 'wrls',
      ...omit(forms.getValues(form), 'csrf_token')
    };

    const { redirectPath } = session.merge(request, key, { data });
    return h.redirect(redirectPath);
  }
  return h.postRedirectGet(form);
};

exports.getPostcode = getPostcode;
exports.postSelectAddress = postSelectAddress;
exports.getManualAddressEntry = getManualAddressEntry;
exports.postManualAddressEntry = postManualAddressEntry;
