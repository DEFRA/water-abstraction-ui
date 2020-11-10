'use strict';

const helpers = require('@envage/water-abstraction-helpers');
const { TWO_PART_TARIFF } = require('./bill-run-types');
const moment = require('moment');

/**
 *
 * @param {String} type - batch type
 * @param {Boolean} isSummer - true for TPT summer bill run only
 * @param {String} [refDate] - reference date for testing
 * @return {Number} financial year ending
 */
const getBatchFinancialYearEnding = (type, isSummer, refDate) => {
  if (type !== TWO_PART_TARIFF) {
    return helpers.charging.getFinancialYear(refDate);
  }
  // Find most recent cycle with matching season where due date has passed
  const cycles = helpers.returns.date.createReturnCycles().reverse();
  const mostRecentCycle = cycles.find(cycle => {
    const isDueDatePast = moment(cycle.dueDate).isBefore(moment(refDate), 'day');
    const isSeasonMatch = cycle.isSummer === isSummer;
    return isDueDatePast && isSeasonMatch;
  });

  // Get financial year of cycle end date
  return helpers.charging.getFinancialYear(mostRecentCycle.endDate);
};

exports.getBatchFinancialYearEnding = getBatchFinancialYearEnding;
