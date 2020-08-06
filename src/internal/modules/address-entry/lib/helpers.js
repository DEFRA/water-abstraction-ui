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
  return postcode.toUpperCase();
};

const getPostcodeUrl = request => {
  const { redirectPath, back } = request.yar.get(SESSION_KEY);
  const urlQuery = queryString.stringify({ redirectPath, back });
  return `/address-entry/postcode?${urlQuery}`;
};

const getSelectAddressUrl = request =>
  `/address-entry/address/select?${queryString.stringify({ postcode: getPostcode(request) })}`;

const pageTemplates = {
  postcode: 'nunjucks/address-entry/enter-uk-postcode',
  selectAddress: 'nunjucks/address-entry/select-address',
  manualAddressEntry: 'nunjucks/form'
};

const getPageData = (request, page) => {
  const pageData = {
    postcode: {
      pageTitle: 'Enter the UK postcode',
      back: request.query.back,
      formContainer: forms.ukPostcode
    },
    selectAddress: {
      pageTitle: 'Select the address',
      back: getPostcodeUrl(request),
      formContainer: forms.selectAddress,
      postcode: getPostcode(request)
    },
    manualAddressEntry: {
      pageTitle: 'Enter the address',
      back: getManualAddressEntryBackLink(request),
      formContainer: forms.manualAddressEntry
    }
  };
  const { licenceNumber } = request.yar.get(SESSION_KEY);

  return {
    ...pageData[page],
    ...licenceNumber && { caption: `Licence ${licenceNumber}` }
  };
};

const getPage = (request, h, page) => {
  const { formContainer, ...data } = getPageData(request, page);
  return h.view(pageTemplates[page], {
    ...request.view,
    ...data,
    form: sessionForms.get(request, formContainer.form(request))
  });
};

exports.SESSION_KEY = SESSION_KEY;

exports.getRedirectPath = getRedirectPath;
exports.getPage = getPage;
exports.getPostcodeUrl = getPostcodeUrl;
exports.getSelectAddressUrl = getSelectAddressUrl;
exports.saveReferenceData = saveReferenceData;
exports.setAddressSearchResults = setAddressSearchResults;
exports.getAddressSearchResults = getAddressSearchResults;
