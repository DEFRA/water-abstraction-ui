/**
 * Helpers for checking/processing licence data
 * @module lib/licence-helpers
 */
const uniq = require('lodash/uniq');
const fs = require('fs');
const Promise = require('bluebird');
const readFile = Promise.promisify(fs.readFile);
const csvParse = Promise.promisify(require('csv-parse'));
const find = require('lodash/find');
const uniqBy = require('lodash/uniqBy');


function findTitle(data, code, subCode) {
    return find(data, (item) => {
      return (item.code === code) && (item.subCode === subCode);
    });
}

/**
 * Formats an abstraction point into a string
 * Example:  name, ngr1, ngr2
 * @param {Object} point - abstraction point from licence data
 * @return {String} abstraction point info formatted as String
 */
function _formatAbstractionPoint(point) {
  const {name, ngr1, ngr2, ngr3, ngr4} = point;
  const parts = [name, ngr1, ngr2, ngr3, ngr4].filter(x => x);
  return parts.join(', ');
}

/**
 * A function to get a list of licence conditions for display
 * from the supplied licenceData which is loaded from the permit repo
 * @param {Object} licenceData
 * @return {Array} conditions
 */
async function licenceConditions(licenceData) {

  // Read condition titles from CSV
  const str = await readFile('./data/condition_titles.csv');
  const data = await csvParse(str, {columns : true});

  // Extract conditions from licence data and attach titles from CS
  let conditions = [];
  licenceData.attributes.licenceData.purposes.forEach((purpose) => {

    purpose.conditions.forEach((condition) => {

      if(!condition.code) {
        return;
      }

      // Format abstraction points
      const points = [];
      purpose.points.forEach((point) => {
        points.push(_formatAbstractionPoint(point));
      });

      // Lookup title in CSV data
      const titles = findTitle(data, condition.code, condition.subCode);
      conditions.push({condition, titles, points});

    });
  });

  return conditions;
}




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
 * Get list of licences with unique addresses
 * @param {Array} licences - a full list of licences
 * @return {Array} a subset of licences containing only those with unique addresses (the first found)
 */
function uniqueAddresses(licences) {
  const uniqueAddresses = [];
  const filteredList = [];
  licences.forEach((licence) => {
    const {AddressLine1, AddressLine2, AddressLine3, AddressLine4, Town, County, Postcode } = licence;
    const address = [AddressLine1, AddressLine2, AddressLine3, AddressLine4, Town, County, Postcode].join(', ').toUpperCase();
    if(!uniqueAddresses.includes(address)) {
      uniqueAddresses.push(address);
      filteredList.push(licence);
    }
  });
  return filteredList;
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
  licenceCount,
  uniqueAddresses,
  licenceConditions
};
