const forms = require('../forms');
const sessionForms = require('shared/lib/session-forms');
const sessionHelpers = require('shared/lib/session-helpers');
const services = require('../../../lib/connectors/services');
const queryString = require('querystring');

const SESSION_KEY = 'newAddressFlow';

const getLicenceNumber = async licenceId => {
  if (licenceId) {
    const { licenceNumber } = await services.water.licences.getLicenceById(licenceId);
    return licenceNumber;
  }
  return null;
};

const getRedirectPath = request =>
  sessionHelpers.getRedirectPathAndClearSession(request, SESSION_KEY);

const saveReferenceData = async request => {
  const { licenceId, redirectPath, back } = request.query;
  const licenceNumber = await getLicenceNumber(licenceId);
  const data = {
    redirectPath,
    back,
    ...licenceNumber && { licenceNumber }
  };
  return sessionHelpers.saveToSession(request, SESSION_KEY, data);
};

const setAddressSearchResults = request => {
  const { addressSearchResults } = request.pre;
  return sessionHelpers.saveToSession(request, SESSION_KEY, { addressSearchResults });
};

const getAddressSearchResults = request => {
  const { addressSearchResults } = request.yar.get(SESSION_KEY);
  return addressSearchResults;
};

const getManualAddressEntryBackLink = request =>
  request.query.country ? '/address-entry/address/select' : getPostcodeUrl(request);

const getPayload = request => request.payload || request.query;

const getPostcode = request => {
  const { postcode: payloadPostcode } = getPayload(request);
  const addressSearchResults = getAddressSearchResults(request);
  const sessionPostcode = addressSearchResults ? addressSearchResults[0].postcode : null;
  const postcode = payloadPostcode || sessionPostcode;
  return postcode ? postcode.toUpperCase() : null;
};

const getPostcodeUrl = request => {
  const { redirectPath, back } = request.yar.get(SESSION_KEY);
  const urlQuery = queryString.stringify({ redirectPath, back });
  return `/address-entry/postcode?${urlQuery}`;
};

const getSelectAddressUrl = request =>
  `/address-entry/address/select?${queryString.stringify({ postcode: getPostcode(request) })}`;

const getPageCaption = request => {
  const { licenceNumber } = request.yar.get(SESSION_KEY);
  if (licenceNumber) return { caption: `Licence ${licenceNumber}` };
};

exports.SESSION_KEY = SESSION_KEY;

exports.getRedirectPath = getRedirectPath;
exports.getPageCaption = getPageCaption;
exports.getPostcode = getPostcode;
exports.getPostcodeUrl = getPostcodeUrl;
exports.getSelectAddressUrl = getSelectAddressUrl;
exports.getManualAddressEntryBackLink = getManualAddressEntryBackLink;
exports.saveReferenceData = saveReferenceData;
exports.setAddressSearchResults = setAddressSearchResults;
exports.getAddressSearchResults = getAddressSearchResults;
