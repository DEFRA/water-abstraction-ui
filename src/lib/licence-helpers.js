/**
 * Helpers for checking/processing licence data
 * @module lib/licence-helpers
 */
const { uniq, find, sortBy, intersection } = require('lodash');
const LicenceTitleLoader = require('./licence-title-loader.js');
const licenceTitleLoader = new LicenceTitleLoader();

/**
 * Finds the relevant title and parameter titles from the supplied
 * CSV data, and returns that row object
 * Also converts all titles to sentence case
 * @param {Array} data - loaded from titles CSV doc
 * @param {String} code - the licence condition code
 * @param {String} subCode - the licence condition sub-code
 * @return {Object|null} object corresponding to licence row (if found)
 */
function _findTitle (data, code, subCode) {
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
function _formatAbstractionPoint (point) {
  const { name, ngr1, ngr2, ngr3, ngr4 } = point;
  const parts = [name, ngr1, ngr2, ngr3, ngr4].filter(x => x);
  return parts.join(', ');
}

/**
 * Convert condition to string
 * @param {Object} condition
 * @return {String}
 */
function _conditionToStr (condition) {
  const { code, subCode, parameter1, parameter2, description, purpose } = condition;
  return [code, subCode, parameter1, parameter2, description, purpose.id].join(',');
}

/**
 * Compare conditions
 * @param {Object} cond1 - first condition
 * @param {Object} cond2 - second condition
 * @return {Boolean} true if the same
 */
function _compareConditions (cond1, cond2) {
  return _conditionToStr(cond1) === _conditionToStr(cond2);
}

/**
 * Creates a unique ID for a condition/point combination
 * @param {Object} condition
 * @param {Array} points
 * @return {String} unique ID
 */
function _createId (condition, purpose) {
  const { points } = purpose;
  return condition.code + '-' + condition.subCode + '-' + sortBy(points.map(point => point.id)).join(',');
}

/**
 * Find unique condition/points within conditions list
 * @param {Array} data - existing list of categorised conditions
 * @param {Object} condition - the condition to find
 * @param {Object} purpose - the purpose
 * @return {Object} container for grouped conditions
 */
async function _findCondition (data, condition, purpose) {
  // Read condition titles from CSV
  const titleData = await licenceTitleLoader.load();

  const { points } = purpose;
  const id = _createId(condition, purpose);
  const item = find(data, item => item.id === id);

  // Existing item found - return it
  if (item) {
    return item;
  }

  // Create new item
  // Lookup title in CSV data
  const titles = _findTitle(titleData, condition.code, condition.subCode);

  const newItem = {
    id,
    code: condition.code,
    subCode: condition.subCode,
    points: points.map(_formatAbstractionPoint),
    conditions: [],
    titles
  };

  data.push(newItem);

  return newItem;
}

/**
 * A function to get a list of licence conditions for display
 * from the supplied licenceData which is loaded from the permit repo
 * @param {Object} licenceData
 * @return {Array} conditions
 */
async function licenceConditions (licenceData) {
  // Extract conditions from licence data and attach titles from CS
  const conditions = [];

  licenceData.purposes.forEach((purpose) => {
    purpose.conditions.forEach(async (condition) => {
      if (!condition.code) {
        return;
      }

      // Find/create condition container
      const conditionContainer = await _findCondition(conditions, condition, purpose);

      const newCondition = {
        ...condition,
        purpose: {
          id: purpose.id,
          description: purpose.description
        } };

      // Avoid duplicates
      const found = find(conditionContainer.conditions, (item) => {
        return _compareConditions(item, newCondition);
      });
      if (!found) {
        conditionContainer.conditions.push(newCondition);
      }
    });
  });

  return conditions;
}

/**
 * A function to extract an array of licence numbers from a user-supplied string
 * @param {String} str - a string containing licence numbers
 * @return {Array} - array of unqiue matched licence numbers
 */
function extractLicenceNumbers (str) {
  // Return unique values
  // @see {@link https://stackoverflow.com/questions/1960473/get-all-unique-values-in-an-array-remove-duplicates}
  return str
    .split(/[ \n\r,\t;]+/ig)
    .filter(s => s)
    .filter((v, i, a) => a.indexOf(v) === i);
}

/**
 * Get list of unique licence holder names and postcodes for
 * supplied list of licences
 * @param {Array} licences - list of licences loaded from CRM
 * @return {Object} - {name, postcodes} lists of unique licence holder names/postcodes
 */
function getUniqueLicenceDetails (licences) {
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
  return { names, postcodes };
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
function checkLicenceSimilarity (licences) {
  const { names, postcodes } = getUniqueLicenceDetails(licences);

  // All 1 name or all 1 postcode - OK
  if (names.length === 1 || postcodes.length === 1) {
    return true;
  }
  // All either same name or same postcode
  return (names.length + postcodes.length) <= 3;
}

/**
 * A function to check a list of newly added licences against
 * a list of existing licences in the user's account to determine whether
 * a new postal verification code is necessary
 * @param {Array} newLicences
 * @param {Array} existingLicences
 * @return {Boolean} return true if postcode/name match found
 */
function checkNewLicenceSimilarity (newLicences, existingLicences) {
  const { names: n1, postcodes: p1 } = getUniqueLicenceDetails(newLicences);
  const { names: n2, postcodes: p2 } = getUniqueLicenceDetails(existingLicences);

  // Is there a match between new/existing names/postcodes
  const names = intersection(n1, n2);
  const postcodes = intersection(p1, p2);

  return (names.length + postcodes.length) > 0;
}

/**
 * Get list of licences with unique addresses
 * @param {Array} licences - a full list of licences
 * @return {Array} a subset of licences containing only those with unique addresses (the first found)
 */
function uniqueAddresses (licences) {
  const uniqueAddresses = [];
  const filteredList = [];
  licences.forEach((licence) => {
    const { AddressLine1, AddressLine2, AddressLine3, AddressLine4, Town, County, Postcode } = licence;
    const address = [AddressLine1, AddressLine2, AddressLine3, AddressLine4, Town, County, Postcode].join(', ').toUpperCase();
    if (!uniqueAddresses.includes(address)) {
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
function licenceRoles (summary) {
  const initial = {
    user: false,
    agent: false,
    admin: false
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
function licenceCount (summary) {
  return summary.reduce((memo, item) => {
    return memo + item.count;
  }, 0);
}

module.exports = {
  extractLicenceNumbers,
  checkLicenceSimilarity,
  checkNewLicenceSimilarity,
  licenceRoles,
  licenceCount,
  uniqueAddresses,
  licenceConditions
};
