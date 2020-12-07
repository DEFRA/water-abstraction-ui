'use strict';

const queryString = require('querystring');

const getPostcode = request => {
  const { key } = request.params;
  const { postcode } = request.query;
  const tail = postcode ? `?${queryString.stringify({ postcode })}` : '';
  return `/address-entry/${key}/postcode${tail}`;
};

const getManualEntry = (request, query) => {
  const { key } = request.params;
  const tail = query ? `?${queryString.stringify(query)}` : '';
  return `/address-entry/${key}/manual-entry${tail}`;
};

exports.getPostcode = getPostcode;
exports.getManualEntry = getManualEntry;
