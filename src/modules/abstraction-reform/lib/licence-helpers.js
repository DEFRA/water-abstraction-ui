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

/**
 * Get conditions from licence
 * @param {Object} data - permit data for licence
 * @return {Array} array of licence conditions
 */
const getConditions = (data) => {
  const purposes = getPurposes(data);
  return purposes.reduce((acc, purpose) => {
    return [...acc, ...purpose.licenceConditions];
  }, []);
};

/**
 * Get a single condition
 * @param {Object} data - all licence data
 * @param {String} conditionId - the condition ID
 * @return {Object} condition
 */
const getCondition = (data, conditionId) => {
  return find(getConditions(data), {ID: conditionId});
};

/**
 * Get the current licence version
 * @param {Object} data - all licence data
 * @return {Object} current version
 */
const getCurrentVersion = (data) => {
  return find(data.data.versions, (version) => version.STATUS === 'CURR');
};

/**
 * Gets a licence version.
 * @param {Object} data
 * @param {String} issueNumber - the licence issue number
 * @param {String} incrementNumber - the increment number
 * @return {Object}
 */
const getVersion = (data, issueNumber, incrementNumber) => {
  return find(data.data.versions, (version) => {
    return (version.ISSUE_NO === issueNumber) && (version.INCR_NO === incrementNumber);
  });
};

/**
 * Get the licence holder party for the current licence version
 * @param {Object} data - all licence data
 * @return {Object} current version
 */
const getCurrentVersionParty = (data) => {
  return data.data.current_version.party;
};

/**
 * Gets flat list of parties from supplied licence data
 * There may be duplication
 * @param {Object} data - licence data
 * @return {Array} parties list
 */
const getParties = (data) => {
  const { versions } = data.data;
  return versions.reduce((acc, version) => {
    return [...acc, ...version.parties];
  }, []);
};

/**
 * Gets party by ID from licence data
 * @param {Object} data - licence data object
 * @param {Number} partyId - the party ID
 * @return {Object} party data
 */
const getParty = (data, partyId) => {
  const parties = getParties(data);
  return find(parties, { ID: partyId });
};

/**
 * Get flat list of addresses from licence data
 * There may be duplication
 * @param {Object} data
 * @return {Array} address list
 */
const getAddresses = (data) => {
  const parties = getParties(data);

  return parties.reduce((acc, party) => {
    const addresses = party.contacts.map(contact => contact.party_address);
    return [...acc, ...addresses];
  }, []);
};

/**
 * Gets address by ID from licence data
 * @param {Object} data - licence data object
 * @param {Number} addressId - the address ID
 * @return {Object} party data
 */
const getAddress = (data, addressId) => {
  const addresses = getAddresses(data);
  return find(addresses, { ID: addressId });
};

/**
 * Get the licence holder party for the current licence version
 * @param {Object} data - all licence data
 * @return {Object} current version
 */
const getCurrentVersionAddress = (data) => {
  return data.data.current_version.address;
};

module.exports = {
  getPurposes,
  getPurpose,
  getLicence,
  getPoints,
  getPoint,
  getConditions,
  getCondition,
  getCurrentVersion,
  getCurrentVersionParty,
  getCurrentVersionAddress,
  getVersion,
  getParty,
  getAddress
};
