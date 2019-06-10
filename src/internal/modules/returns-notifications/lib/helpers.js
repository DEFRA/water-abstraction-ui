const { uniq, last } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');

const getUniqueLicenceNumbers = (returns) => {
  return uniq(returns.map(row => row.licence_ref));
};

/**
 * Gets the end date of the current cycle
 * @param  {String} date - Optional reference date
 * @return {String}      - end date of the current cycle
 */
const getCurrentCycleEndDate = (date) => {
  const { endDate } = last(helpers.returns.date.createReturnCycles(undefined, date));
  return endDate;
};

/**
 * Gets request-based config data for sending final reminder
 * @param  {Object} request - current hAPI request
 * @return {Object}         - contains email and endDate params
 */
const getFinalReminderConfig = (request) => {
  const { userName: email } = request.defra;
  const endDate = getCurrentCycleEndDate();
  return {
    email,
    endDate
  };
};

module.exports = {
  getUniqueLicenceNumbers,
  getCurrentCycleEndDate,
  getFinalReminderConfig
};
