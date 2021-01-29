'use strict';

const queryString = require('querystring');
const { isEmpty } = require('lodash');

const getPathWithQuery = (path, query) => {
  const tail = !isEmpty(query) ? `?${queryString.stringify(query)}` : '';
  return `${path}${tail}`;
};

const getSelectExistingAccount = (key, searchQuery) =>
  getPathWithQuery(`/account-entry/${key}/select-existing-account`, searchQuery && { q: searchQuery });

const getSelectAccountType = key =>
  `/account-entry/${key}/select-account-type`;

const getCompanySearch = (key, searchQuery) =>
  getPathWithQuery(`/account-entry/${key}/company-search`, searchQuery && { q: searchQuery });

exports.getSelectExistingAccount = getSelectExistingAccount;
exports.getSelectAccountType = getSelectAccountType;
exports.getCompanySearch = getCompanySearch;
