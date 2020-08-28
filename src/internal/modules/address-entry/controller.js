const { ukPostcode, selectAddress, manualAddressEntry } = require('./forms');
const forms = require('shared/lib/forms');
const helpers = require('./lib/helpers');
const { omit } = require('lodash');
const queryString = require('querystring');

const sessionForms = require('shared/lib/session-forms');

const storeAddressAndRedirect = (request, h, address) => {
  request.setNewAddress(address);
  const redirectPath = helpers.getRedirectPath(request);
  return h.redirect(redirectPath);
};

const getPostcode = async (request, h) => {
  await helpers.saveReferenceData(request);

  return h.view('nunjucks/address-entry/enter-uk-postcode', {
    ...request.view,
    ...helpers.getPageCaption(request),
    pageTitle: 'Enter the UK postcode',
    back: request.query.back,
    form: sessionForms.get(request, ukPostcode.form(request))
  });
};

const postPostcode = async (request, h) => {
  const { postcode } = request.payload;
  const form = forms.handleRequest(
    ukPostcode.form(request),
    request,
    ukPostcode.schema
  );

  if (form.isValid) {
    const queryTail = queryString.stringify({ postcode: postcode.toUpperCase() });
    return h.redirect(`/address-entry/address/select?${queryTail}`);
  }
  return h.postRedirectGet(form, '/address-entry/postcode', helpers.getPostcodeUrlParams(request));
};

const getSelectAddress = (request, h) => h.view('nunjucks/address-entry/select-address', {
  ...request.view,
  ...helpers.getPageCaption(request),
  pageTitle: 'Select the address',
  back: helpers.getPostcodeUrl(request),
  postcode: request.query.postcode,
  form: sessionForms.get(request, selectAddress.form(request, helpers.getAddressUprn(request)))
});

const postSelectAddress = (request, h) => {
  const { postcode, uprn } = request.payload;
  const { addressSearchResults } = request.pre;
  const form = forms.handleRequest(
    selectAddress.form(request, uprn),
    request,
    selectAddress.schema
  );

  if (form.isValid) {
    const selectedAddress = addressSearchResults.find(address => address.uprn === parseInt(uprn));
    return storeAddressAndRedirect(request, h, selectedAddress);
  }

  return h.postRedirectGet(form, '/address-entry/address/select', { postcode });
};

const getManualAddressEntry = (request, h) => h.view('nunjucks/form', {
  ...request.view,
  ...helpers.getPageCaption(request),
  pageTitle: 'Enter the address',
  back: helpers.getManualAddressEntryBackLink(request),
  form: sessionForms.get(request, manualAddressEntry.form(request, request.getNewAddress(false)))
});

const postManualAddressEntry = (request, h) => {
  let form = forms.handleRequest(
    manualAddressEntry.form(request, request.payload),
    request,
    manualAddressEntry.schema
  );

  form = manualAddressEntry.applyRequiredFieldErrors(form, request.payload);

  if (form.isValid) {
    return storeAddressAndRedirect(request, h, omit(request.payload, 'csrf_token'));
  }
  return h.postRedirectGet(form);
};

exports.getPostcode = getPostcode;
exports.postPostcode = postPostcode;
exports.getSelectAddress = getSelectAddress;
exports.postSelectAddress = postSelectAddress;
exports.getManualAddressEntry = getManualAddressEntry;
exports.postManualAddressEntry = postManualAddressEntry;
