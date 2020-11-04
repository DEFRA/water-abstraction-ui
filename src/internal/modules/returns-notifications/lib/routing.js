'use strict';

/**
 * @module route helpers for paper forms flow
 */

const querystring = require('querystring');

const { SESSION_KEYS } = require('../lib/constants');

const getEnterLicenceNumber = () => '/returns-notifications/paper-forms';

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
  const state = request.yar.get(SESSION_KEYS.paperFormsFlow);
  const { id: licenceId } = state[documentId].licence;
  const query = {
    back: getRecipient(documentId),
    redirectPath: getAcceptOneTimeAddress(documentId),
    licenceId
  };
  return `/address-entry/postcode?${querystring.stringify(query)}`;
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
