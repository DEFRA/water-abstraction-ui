const sessionHelpers = require('shared/lib/session-helpers');
const services = require('../../../lib/connectors/services');
const queryString = require('querystring');
const { compact } = require('lodash');
const titleCase = require('title-case');
const SESSION_KEY = 'newAddressFlow';

const getSession = request => request.yar.get(SESSION_KEY);

const getLicenceNumber = async licenceId => {
  if (licenceId) {
    const { licenceNumber } = await services.water.licences.getLicenceById(licenceId);
    return licenceNumber;
  }
  return null;
};

const clearSessionData = request => request.yar.clear(SESSION_KEY);

const getRedirectPath = request => {
  const { redirectPath } = getSession(request);
  return redirectPath;
};

const saveReferenceData = async request => {
  clearSessionData(request);
  const { licenceId, redirectPath, back } = request.query;
  const licenceNumber = await getLicenceNumber(licenceId);
  const data = {
    redirectPath,
    back,
    ...licenceId && { licenceId, licenceNumber }
  };
  return sessionHelpers.saveToSession(request, SESSION_KEY, data);
};

const getAddressUprn = request => {
  const { uprn } = request.getNewAddress(false);
  return uprn || null;
};

const getManualAddressEntryBackLink = request =>
  request.query.country ? '/address-entry/address/select' : getPostcodeUrl(request);

const getPostcodeUrlParams = request => {
  const { redirectPath, back, licenceId } = getSession(request);
  return { redirectPath, back, ...licenceId && { licenceId } };
};

const getPostcodeUrl = request => {
  const urlQuery = queryString.stringify(getPostcodeUrlParams(request));
  return `/address-entry/postcode?${urlQuery}`;
};

const getPageCaption = request => {
  const session = getSession(request);
  if (session && session.licenceNumber) return { caption: `Licence ${session.licenceNumber}` };
};

const getAddressText = address => {
  const { addressLine1, addressLine2, addressLine3, addressLine4 } = address;
  const addressLines = compact([addressLine1, addressLine2, addressLine3, addressLine4])
    .map(line => titleCase(line))
    .join(' ');
  return `${addressLines}, ${titleCase(address.town)}, ${address.postcode}`;
};

exports.SESSION_KEY = SESSION_KEY;

exports.getRedirectPath = getRedirectPath;
exports.getAddressUprn = getAddressUprn;
exports.getPageCaption = getPageCaption;
exports.getPostcodeUrlParams = getPostcodeUrlParams;
exports.getPostcodeUrl = getPostcodeUrl;
exports.getManualAddressEntryBackLink = getManualAddressEntryBackLink;
exports.saveReferenceData = saveReferenceData;
exports.getAddressText = getAddressText;
