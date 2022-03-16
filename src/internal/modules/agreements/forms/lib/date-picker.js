'use strict';

const DATE_FORMAT = 'YYYY-MM-DD';
const moment = require('moment');

const JoiDate = require('@joi/date');
const Joi = require('joi').extend(JoiDate);

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
    'any.required': {
      message: 'Enter a real date'
    },
    'date.format': {
      message: 'Enter a real date'
    },
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

const getFinancialYearsDateBetweenDates = (startDate, endDate, startOrEnd = 'start') => {
  const effectiveEndDate = endDate || moment(new Date()).add(10, 'years');
  const effectiveStartDate = (moment(startDate).isBefore(moment()) && startDate) || moment(new Date());

  const now = moment(effectiveStartDate).clone();
  const dates = [];

  while (now.isSameOrBefore(effectiveEndDate)) {
    const iterationOfDate = now.format(`YYYY${startOrEnd === 'start' ? '-04-01' : '-03-31'}`);

    if (moment(iterationOfDate).isBetween(effectiveStartDate, effectiveEndDate)) {
      dates.push(iterationOfDate);
    }
    now.add(1, 'year');
  }
  return dates;
};

const getAgreementStartDateValidator = (licence, chargeVersions) => {
  const { startDate, endDate } = licence;
  const effectiveEndDate = endDate || moment(new Date()).add(10, 'years');

  const chargeVersionStartDates = chargeVersions.map(cv => cv.dateRange.startDate);

  const allowedDates = [...chargeVersionStartDates, ...getFinancialYearsDateBetweenDates(startDate, effectiveEndDate, 'start')].filter(x => x);

  return Joi.date().format(DATE_FORMAT).options({ convert: false }).raw().valid(...allowedDates).required();
};

const getAgreementEndDateValidator = (licence, chargeVersions, agreement) => {
  const { endDate } = licence;
  const effectiveEndDate = endDate || moment(new Date()).add(10, 'years');

  const chargeVersionEndDates = chargeVersions.map(cv => cv.dateRange.endDate);

  const allowedDates = [...chargeVersionEndDates, ...getFinancialYearsDateBetweenDates(agreement.dateRange.startDate, effectiveEndDate, 'end')].filter(x => x);

  return Joi.date().format(DATE_FORMAT).options({ convert: false }).raw().valid(...allowedDates).required();
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
  return Joi.date().format(DATE_FORMAT).min(startDate).max(maxDate).required();
};

exports.getMaxDate = getMaxDate;
exports.getCommonErrors = getCommonErrors;
exports.getAgreementStartDateValidator = getAgreementStartDateValidator;
exports.getAgreementEndDateValidator = getAgreementEndDateValidator;
exports.getDateValidator = getDateValidator;
