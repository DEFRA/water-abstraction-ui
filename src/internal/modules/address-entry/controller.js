const { ukPostcode, selectAddress, manualAddressEntry } = require('./forms');
const forms = require('shared/lib/forms');
const helpers = require('./lib/helpers');
const { omit } = require('lodash');

const sessionForms = require('shared/lib/session-forms');

const storeAddressAndRedirect = (request, h, address) => {
  request.setNewAddress(address);
  const redirectPath = helpers.getRedirectPath(request);
  return h.redirect(redirectPath);
};

const getPostcode = (request, h) => {
  helpers.saveReferenceData(request);
  const form = sessionForms.get(request, ukPostcode.form(request));

  return h.view('nunjucks/address-entry/enter-uk-postcode', {
    ...request.view,
    ...helpers.getPageCaption(request),
    pageTitle: 'Enter the UK postcode',
    back: request.query.back,
    form
  });
};

const postPostcode = async (request, h) => {
  const { postcode } = request.payload;
  const form = forms.handleRequest(
    ukPostcode.form(request, postcode),
    request,
    ukPostcode.schema
  );

  if (form.isValid) {
    helpers.setPostcode(request);
    return h.redirect('/address-entry/address/select');
  }
  const { redirectPath, back } = request.yar.get(helpers.SESSION_KEY);
  return h.postRedirectGet(form, '/address-entry/postcode', { redirectPath, back });
};

const getSelectAddress = (request, h) =>
  h.view('nunjucks/address-entry/select-address', {
    ...request.view,
    ...helpers.getPageCaption(request),
    pageTitle: 'Select the address',
    back: helpers.getPostcodeUrl(request),
    postcode: helpers.getPostcode(request),
    form: sessionForms.get(request, selectAddress.form(request))
  });

const postSelectAddress = (request, h) => {
  const { uprn } = request.payload;
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

  return h.postRedirectGet(form, '/address-entry/address/select', { postcode: helpers.getPostcode(request) });
};

const getManualAddressEntry = (request, h) => h.view('nunjucks/form', {
  ...request.view,
  ...helpers.getPageCaption(request),
  pageTitle: 'Enter the address',
  back: helpers.getManualAddressEntryBackLink(request),
  form: sessionForms.get(request, manualAddressEntry.form(request))
});

const postManualAddressEntry = (request, h) => {
  let form = forms.handleRequest(
    manualAddressEntry.form(request, request.payload),
    request,
    manualAddressEntry.schema
  );

  form = manualAddressEntry.applyRequiredFieldErrors(form, request.payload);

  if (form.isValid) {
    return storeAddressAndRedirect(request, h, omit(request.payload, ['csrfToken']));
  }
  return h.postRedirectGet(form);
};

exports.getPostcode = getPostcode;
exports.postPostcode = postPostcode;
exports.getSelectAddress = getSelectAddress;
exports.postSelectAddress = postSelectAddress;
exports.getManualAddressEntry = getManualAddressEntry;
exports.postManualAddressEntry = postManualAddressEntry;
