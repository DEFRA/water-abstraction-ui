'use strict';

const DATE_FORMAT = 'YYYY-MM-DD';
const moment = require('moment');
const Joi = require('@hapi/joi');

/**
 * Gets the maximum date - this is the earliest of:
 * - The licence end date
 * - Today's date
 * @param {String} licenceEndDate
 * @param {String} [refDate] - reference date for testing
 * @return {Object}
 */
const getMaxDate = (licenceEndDate, refDate) => {
  const today = moment(refDate);
  const isLicenceEndDate = licenceEndDate && moment(licenceEndDate).isBefore(today, 'day');

  return {
    maxDate: isLicenceEndDate ? licenceEndDate : today.format(DATE_FORMAT),
    isLicenceEndDate
  };
};

/**
 * Gets error messages common to both date pickers in the flow
 * @param {String} licenceEndDate
 * @param {String} [refDate] - reference date for testing
 * @return {Object}
 */
const getCommonErrors = (licenceEndDate, refDate) => {
  const { isLicenceEndDate } = getMaxDate(licenceEndDate, refDate);
  return {
    'date.max': {
      message: isLicenceEndDate
        ? 'Enter a date no later than the licence end date'
        : 'The date you enter must be today’s date or earlier. It cannot be in the future'
    },
    'date.min': {
      message: 'Enter a date that is no earlier than the licence start date'
    }
  };
};

/**
 * Returns a Joi validator for the date fields.  The date is limited to:
 * - No earlier than the licence start date
 * - No later than today or the licence end date
 * @param {Object} licence
 * @return {Object} Joi validator
 */
const getDateValidator = licence => {
  const { startDate, endDate } = licence;
  const { maxDate } = getMaxDate(endDate);
  return Joi.date().min(startDate).max(maxDate).iso().required();
};

exports.getMaxDate = getMaxDate;
exports.getCommonErrors = getCommonErrors;
exports.getDateValidator = getDateValidator;
