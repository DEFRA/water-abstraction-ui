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

const getManualAddressEntryBackLink = request =>
  request.query.country ? '/address-entry/address/select' : getPostcodeUrl(request);

const setPostcode = request =>
  sessionHelpers.saveToSession(request, SESSION_KEY, { postcode: request.payload.postcode });

const getPostcode = request => {
  const { postcode } = request.yar.get(SESSION_KEY);
  return postcode ? postcode.toUpperCase() : null;
};

const getPostcodeUrl = request => {
  const { redirectPath, back } = request.yar.get(SESSION_KEY);
  const urlQuery = queryString.stringify({ redirectPath, back });
  return `/address-entry/postcode?${urlQuery}`;
};

const getPageCaption = request => {
  const { licenceNumber } = request.yar.get(SESSION_KEY);
  if (licenceNumber) return { caption: `Licence ${licenceNumber}` };
};

exports.SESSION_KEY = SESSION_KEY;

exports.getRedirectPath = getRedirectPath;
exports.getPageCaption = getPageCaption;
exports.setPostcode = setPostcode;
exports.getPostcode = getPostcode;
exports.getPostcodeUrl = getPostcodeUrl;
exports.getManualAddressEntryBackLink = getManualAddressEntryBackLink;
exports.saveReferenceData = saveReferenceData;
