const { ukPostcode, selectAddress, manualAddressEntry } = require('./forms');
const forms = require('shared/lib/forms');
const newAddress = require('../../lib/new-address');
const helpers = require('./lib/helpers');
const { partialRight, omit } = require('lodash');

const storeAddressAndRedirect = (request, h, address) => {
  newAddress.set(request, address);
  const redirectPath = helpers.getRedirectPath(request);
  return h.redirect(redirectPath);
};

const getPostcode = (request, h) => {
  helpers.saveReferenceData(request);
  return helpers.getPage(request, h, 'postcode');
};

const postPostcode = async (request, h) => {
  const { postcode } = request.payload;
  const form = forms.handleRequest(
    ukPostcode.form(request, postcode),
    request,
    ukPostcode.schema
  );

  if (form.isValid) {
    return h.redirect(helpers.getSelectAddressUrl(request));
  }

  return h.postRedirectGet(form, helpers.getPostcodeUrl(request));
};

const getSelectAddress = (request, h) => {
  helpers.setAddressSearchResults(request);
  return helpers.getPage(request, h, 'selectAddress');
};

const postSelectAddress = (request, h) => {
  const { uprn } = request.payload;
  const form = forms.handleRequest(
    selectAddress.form(request, uprn),
    request,
    selectAddress.schema
  );

  if (form.isValid) {
    const addressSearchResults = helpers.getAddressSearchResults(request);
    const selectedAddress = addressSearchResults.find(address => address.uprn === parseInt(uprn));
    return storeAddressAndRedirect(request, h, selectedAddress);
  }

  return h.postRedirectGet(form);
};

const getManualAddressEntry = partialRight(helpers.getPage, 'manualAddressEntry');

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
