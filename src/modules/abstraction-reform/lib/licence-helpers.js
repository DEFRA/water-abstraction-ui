/**
 * Helpers for finding data values within licence
 */

const { find } = require('lodash');

/**
 * Get purposes
 * @param {Object} data - permit data for licence
 * @return {Array} array of purposes
 */
const getPurposes = (data) => {
  return data.data.current_version.purposes;
};

/**
 * Get purpose
 * @param {Object} data - permit data for licence
 * @param
 */
const getPurpose = (data, purposeId) => {
  return find(getPurposes(data), {ID: purposeId});
};

/**
 * Get licence
 * @param {Object} data - permit data for licence
 * @param
 */
const getLicence = (data) => {
  return data;
};

/**
 * Get points
 * @param {Object} data - permit data for licence
 * @return {Array} array of points
 */
const getPoints = (data) => {
  return data.data.current_version.purposes;
};

module.exports = {
  getPurposes,
  getPurpose,
  getLicence
};
