'use strict';

const { getFinancialYear } = require('@envage/water-abstraction-helpers').charging;

/**
 * Gets the agreement start date.
 * This is the later of:
 * - The start of the financial year in which the agreement was signed
 * - The licence start date
 * @param {String} dateSigned
 * @param {String} licenceStartDate
 * @return {String}
 */
const getStartDate = (dateSigned, licence) => {
  const financialYearEnding = getFinancialYear(dateSigned);
  const dates = [
    licence.startDate,
    `${financialYearEnding - 1}-04-01`
  ];
  return dates.sort().pop();
};

exports.getStartDate = getStartDate;
