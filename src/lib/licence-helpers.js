/**
 * Helpers for checking/processing licence data
 * @module lib/licence-helpers
 */
 const uniq = require('lodash/uniq');

/**
 * A function to extract an array of licence numbers from a user-supplied string
 * @param {String} str - a string containing licence numbers
 * @return {Array} - array of unqiue matched licence numbers
 */
function extractLicenceNumbers(str) {
  // Return unique values
  // @see {@link https://stackoverflow.com/questions/1960473/get-all-unique-values-in-an-array-remove-duplicates}
  return str
    .split(/[^a-z0-9\/]+/ig)
    .filter(s => s)
    .filter((v, i, a) => a.indexOf(v) === i);
}


/**
 * A function to check whether an array of returned licences are similar
 * this is defined for now as:
 * - if only 1 licence supplied, always passes
 * - names and postcodes are sanitized
 * - a unique list of names and postcodes is generated
 * - if all licences have same postcode or name, passes
 * - if there are no more than 3 unique names and postcodes
 * - otherwise fails
 * @param {Array} licences - array of licences returned from DB
 * @return {Boolean} - whether licences pass similarity test
 */
function checkLicenceSimilarity(licences) {
  const sanitize = (x) => {
    x = x.trim();
    x = x.replace('&', 'AND');
    x = x.replace(/[^a-z0-9]/ig, '');
    x = x.toLowerCase();
    return x;
  };
  const names = uniq(licences.map((licence) => {
    return sanitize(licence.metadata.Name || '');
  }));
  const postcodes = uniq(licences.map((licence) => {
    return sanitize(licence.metadata.Postcode || '');
  }));
  // All 1 name or all 1 postcode - OK
  if(names.length === 1 || postcodes.length === 1) {
    return true;
  }
  // All either same name or same postcode
  return (names.length + postcodes.length) <= 3;
}

/**
 * A function to get role flags from
 * supplied licences summary returned from CRM
 * @param {Array} summary - summary data from licences list call
 * @return {Object} with boolean flags for each user role and total licence count
 */
function licenceRoles(summary) {
  const initial = {
    user : false,
    agent : false,
    admin : false
  };
  return summary.reduce((memo, item) => {
    memo[item.role] = true;
    return memo;
  }, initial);
}

/**
 * A function to get total number of licences from
 * supplied licences summary returned from CRM
 * @param {Array} summary - summary data from licences list call
 * @return {Number} total licence count
 */
function licenceCount(summary) {
  return summary.reduce((memo, item) => {
    return memo + item.count;
  }, 0);
}


module.exports = {
  extractLicenceNumbers,
  checkLicenceSimilarity,
  licenceRoles,
  licenceCount
};
