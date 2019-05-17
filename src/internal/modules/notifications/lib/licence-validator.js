const { difference, get, isEmpty } = require('lodash');

const isMany = licenceNumbers => licenceNumbers.length > 1;

/**
 * Given array of licence numbers, returns an array of error messages
 * @param  {Array} licenceNumbers - list of licence numbers that could not be found
 * @return {Array}                - Array of validation error objects
 */
const mapErrors = licenceNumbers => {
  if (isEmpty(licenceNumbers)) {
    return [];
  }
  if (licenceNumbers.length) {
    return [{
      message: `Licence ${isMany(licenceNumbers) ? 'numbers' : 'number'} ${licenceNumbers.join(', ')} could not be found`
    }];
  }
};

/**
 * Validates the CRM documents loaded against the filter query to
 * find whether some licences have not been matched
 * @param  {Object} filter - filter object used to query CRM documents
 * @param  {Object} data   - data returned from CRM call
 * @return {Array}        - Array of validation error objects
 */
const licenceValidator = (filter, data) => {
  const query = get(filter, 'system_external_id.$in', []);
  const matched = data.map(row => row.system_external_id);
  return mapErrors(difference(query, matched));
};

module.exports = {
  isMany,
  mapErrors,
  licenceValidator
};
