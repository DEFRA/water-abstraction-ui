const { get, negate, isEmpty } = require('lodash');

const getAddressLinesFromLicence = licence => {
  return [
    get(licence, 'metadata.Name', ''),
    get(licence, 'metadata.AddressLine1', ''),
    get(licence, 'metadata.AddressLine2', ''),
    get(licence, 'metadata.AddressLine3', ''),
    get(licence, 'metadata.AddressLine4', ''),
    get(licence, 'metadata.Town', ''),
    get(licence, 'metadata.County', '')
  ]
    .map(str => str.trim())
    .filter(negate(isEmpty));
};

/**
 * Add FAO details to first line of address. If address lines are full, add FAO to start of first line
 * @param {Array} lines address lines
 * @param {String} fao  name of person to address letter to
 */
const addFaoToAddress = (lines, fao) => {
  if (lines.length >= 6) {
    lines[0] = `${fao}, `.concat(lines[0]);
  } else {
    lines.unshift(fao);
  }
  return lines;
};

/**
 * There are 6 available address slots in the notify templates, plus an extra for postcode.
 *
 * Therefore if there are more than 6, remove the AddressLine4 item which
 * hopefully leaves the most important address components in place.
 */
const ensureMaximumAddressLength = lines => {
  if (lines.length > 6) {
    lines.splice(4, 1);
  }
  return lines;
};

const createAddress = (licence, fao) => {
  const lines = getAddressLinesFromLicence(licence);
  if (fao) addFaoToAddress(lines, fao);
  ensureMaximumAddressLength(lines);

  return lines.reduce((memo, line, i) => {
    memo[`address_line_${i + 1}`] = line;
    return memo;
  }, {
    postcode: get(licence, 'metadata.Postcode', '')
  });
};

exports.createAddress = createAddress;
