'use strict';

/**
 * @module route helpers for paper forms flow
 */

const getEnterLicenceNumber = () => '/returns-notifications/paper-forms';

const getSelectLicenceHolders = () => '/returns-notifications/select-licence-holders';

const getCheckAnswers = () => '/returns-notifications/check-answers';

const getSelectReturns = documentId => `/returns-notifications/${documentId}/select-returns`;

const getSelectAddress = documentId => `/returns-notifications/${documentId}/select-address`;

const getOneTimeAddress = documentId => `/returns-notifications/${documentId}/one-time-address`;

const getSelectAddressRedirect = request => {
  const { documentId } = request.params;
  const { selectedRole } = request.payload;
  return selectedRole === 'createOneTimeAddress'
    ? getOneTimeAddress(documentId)
    : getCheckAnswers();
};

exports.getCheckAnswers = getCheckAnswers;
exports.getEnterLicenceNumber = getEnterLicenceNumber;
exports.getSelectLicenceHolders = getSelectLicenceHolders;
exports.getSelectReturns = getSelectReturns;
exports.getSelectAddress = getSelectAddress;
exports.getSelectAddressRedirect = getSelectAddressRedirect;
