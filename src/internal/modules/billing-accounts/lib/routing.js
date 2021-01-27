'use strict';

const queryString = require('querystring');
const { isEmpty } = require('lodash');

const getPathWithQuery = (path, query) => {
  const tail = !isEmpty(query) ? `?${queryString.stringify(query)}` : '';
  return `${path}${tail}`;
};

const getSelectExistingBillingAccount = key =>
  getPathWithQuery(`/billing-account-entry/${key}`);

const getSelectAccount = key =>
  getPathWithQuery(`/billing-account-entry/${key}/select-account`);

const getFAORequired = key =>
  getPathWithQuery(`/billing-account-entry/${key}/fao`);

const getHandleAgentAccountEntry = key =>
  getPathWithQuery(`/billing-account-entry/${key}/account-entry`);

const getHandleAddressEntry = (key, query) =>
  getPathWithQuery(`/billing-account-entry/${key}/address-entry`, query);

const getHandleContactEntry = key =>
  getPathWithQuery(`/billing-account-entry/${key}/contact-entry`);

const getCheckAnswers = key =>
  getPathWithQuery(`/billing-account-entry/${key}/check-answers`);

exports.getSelectExistingBillingAccount = getSelectExistingBillingAccount;
exports.getSelectAccount = getSelectAccount;
exports.getFAORequired = getFAORequired;
exports.getHandleAgentAccountEntry = getHandleAgentAccountEntry;
exports.getHandleAddressEntry = getHandleAddressEntry;
exports.getHandleContactEntry = getHandleContactEntry;
exports.getCheckAnswers = getCheckAnswers;
