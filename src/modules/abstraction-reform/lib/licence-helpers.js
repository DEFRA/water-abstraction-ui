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
 * Gets points from the supplied licence data
 * @param {Object} data - permit data for licence
 * @return {Array} array of licence points
 */
const getPoints = (data) => {
  const purposes = getPurposes(data);
  return purposes.reduce((acc, purpose) => {
    const points = purpose.purposePoints.map(row => row.point_detail);
    return [...acc, ...points];
  }, []);
};

/**
 * Get a single point
 * @param {Object} data - all licence data
 * @param {String} pointId - the point ID
 * @return {Object} point
 */
const getPoint = (data, pointId) => {
  return find(getPoints(data), {ID: pointId});
};

module.exports = {
  getPurposes,
  getPurpose,
  getLicence,
  getPoints,
  getPoint
};
