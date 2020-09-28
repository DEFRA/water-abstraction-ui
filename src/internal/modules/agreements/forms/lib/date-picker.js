'use strict';

const DATE_FORMAT = 'YYYY-MM-DD';
const moment = require('moment');

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
 * @return {Object}
 */
const getCommonErrors = licenceEndDate => {
  const { isLicenceEndDate } = getMaxDate(licenceEndDate);
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

exports.getMaxDate = getMaxDate;
exports.getCommonErrors = getCommonErrors;
