'use strict';

const queryString = require('querystring');

const getPathWithQuery = (path, query) => {
  const tail = query ? `?${queryString.stringify(query)}` : '';
  return `${path}${tail}`;
};

const getPostcode = (key, query) =>
  getPathWithQuery(`/address-entry/${key}/postcode`, query);

const getManualEntry = (key, query) =>
  getPathWithQuery(`/address-entry/${key}/manual-entry`, query);

const getCompanyAddress = key =>
  `/address-entry/${key}/select-company-address`;

const getRegisteredAddress = key =>
  `/address-entry/${key}/use-registered-address`;

exports.getPostcode = getPostcode;
exports.getManualEntry = getManualEntry;
exports.getCompanyAddress = getCompanyAddress;
exports.getRegisteredAddress = getRegisteredAddress;
