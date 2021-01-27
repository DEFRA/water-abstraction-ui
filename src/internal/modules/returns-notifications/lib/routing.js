'use strict';

/**
 * @module route helpers for paper forms flow
 */

const getEnterLicenceNumber = () => '/returns-notifications/forms';

const getSelectLicenceHolders = () => '/returns-notifications/select-licence-holders';

const getCheckAnswers = () => '/returns-notifications/check-answers';

const getSelectReturns = documentId => `/returns-notifications/${documentId}/select-returns`;

const getSelectAddress = documentId => `/returns-notifications/${documentId}/select-address`;

const getRecipient = documentId => `/returns-notifications/${documentId}/recipient`;

const getOneTimeAddress = documentId => `/returns-notifications/${documentId}/one-time-address`;

const getAcceptOneTimeAddress = documentId => `/returns-notifications/${documentId}/accept-one-time-address`;

const getSelectAddressRedirect = request => {
  const { documentId } = request.params;
  const { selectedRole } = request.payload;
  return selectedRole === 'createOneTimeAddress'
    ? getRecipient(documentId)
    : getCheckAnswers();
};

const getAddressFlowRedirect = request => {
  const { documentId } = request.params;
  const { document } = request.pre;

  return request.addressLookupRedirect({
    key: documentId,
    back: getRecipient(documentId),
    caption: `Licence ${document.licence.licenceNumber}`,
    redirectPath: `/returns-notifications/${documentId}/accept-one-time-address`
  });
};

exports.getCheckAnswers = getCheckAnswers;
exports.getEnterLicenceNumber = getEnterLicenceNumber;
exports.getSelectLicenceHolders = getSelectLicenceHolders;
exports.getSelectReturns = getSelectReturns;
exports.getSelectAddress = getSelectAddress;
exports.getRecipient = getRecipient;
exports.getSelectAddressRedirect = getSelectAddressRedirect;
exports.getAddressFlowRedirect = getAddressFlowRedirect;
exports.getOneTimeAddress = getOneTimeAddress;
exports.getAcceptOneTimeAddress = getAcceptOneTimeAddress;
