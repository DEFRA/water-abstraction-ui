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
  if(licences.name < 2) {
    return true;
  }
  const sanitize = (x) => {
    x = x.trim();
    x = x.replace('&', 'AND');
    x = x.replace(/[^a-z0-9]/ig, '');
    x = x.toLowerCase();
    return x;
  };
  const names = uniq(licences.map((licence) => {
    return sanitize(licence.document_original_name);
  }));
  const postcodes = uniq(licences.map((licence) => {
    return sanitize(licence.document_postcode);
  }));
  if(names.length === 1 || postcodes.length === 1) {
    return true;
  }
  return (names.length + postcodes.length) <= 3;
}


module.exports = {
  extractLicenceNumbers,
  checkLicenceSimilarity
};
