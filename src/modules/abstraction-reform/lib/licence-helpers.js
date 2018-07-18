/**
 * Helpers for finding data values within licence
 */
const getPurposes = (data) => {
  return data.data.current_version.purposes;
};

module.exports = {
  getPurposes
};
