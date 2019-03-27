const moment = require('moment');
const { pick, get, mapValues } = require('lodash');

/**
 * Checks whether a supplied day/month is the same or after a reference day/month
 * @param {Number} day - the day to test
 * @param {Number} month - the month to test
 * @param {Number} refDay - the reference day
 * @param {Number} refMonth - the reference month
 * @return {Boolean}
 */
const isSameOrAfter = (day, month, refDay, refMonth) => {
  if (month > refMonth) {
    return true;
  }
  return ((month === refMonth) && (day >= refDay));
};

/**
 * Checks whether a supplied day/month is the same or before a reference day/month
 * @param {Number} day - the day to test
 * @param {Number} month - the month to test
 * @param {Number} refDay - the reference day
 * @param {Number} refMonth - the reference month
 * @return {Boolean}
 */
const isSameOrBefore = (day, month, refDay, refMonth) => {
  if (month < refMonth) {
    return true;
  }
  return (month === refMonth) && (day <= refDay);
};

/**
 * Checks whether the specified date is within the abstraction period
 * @param {String} date - the date to test, format YYYY-MM-DD
 * @param {Object} options - abstraction period
 * @param {Number} options.periodStartDay - abstraction period start day of the month
 * @param {Number} options.periodStartMonth - abstraction period start month
 * @param {Number} options.periodEndDay - abstraction period end day of the month
 * @param {Number} options.periodEndMonth - abstraction period end month
 * @return {Boolean} whether supplied date is within abstraction period
 */
const isDateWithinAbstractionPeriod = (date, options) => {
  const {
    periodEndDay,
    periodEndMonth,
    periodStartDay,
    periodStartMonth
  } = options;

  // Month and day of test date
  const month = moment(date).month() + 1;
  const day = moment(date).date();

  // Period start date is >= period end date
  if (isSameOrAfter(periodEndDay, periodEndMonth, periodStartDay, periodStartMonth)) {
    return isSameOrAfter(day, month, periodStartDay, periodStartMonth) &&
      isSameOrBefore(day, month, periodEndDay, periodEndMonth);
  } else {
    const prevYear = isSameOrAfter(day, month, 1, 1) &&
     isSameOrBefore(day, month, periodEndDay, periodEndMonth);

    const thisYear = isSameOrAfter(day, month, periodStartDay, periodStartMonth) &&
     isSameOrBefore(day, month, 31, 12);

    return prevYear || thisYear;
  }
};

const getDay = date => moment(date, 'YYYY-MM-DD').date();
const getMonth = date => moment(date, 'YYYY-MM-DD').month() + 1;

const hasCustomAbstractionPeriod = returnData => {
  return get(returnData, 'reading.totalCustomDates', false);
};

const getCustomAbstractionPeriodStartEnd = returnData => {
  const { totalCustomDateStart, totalCustomDateEnd } = returnData.reading;
  return {
    periodStartDay: getDay(totalCustomDateStart),
    periodStartMonth: getMonth(totalCustomDateStart),
    periodEndDay: getDay(totalCustomDateEnd),
    periodEndMonth: getMonth(totalCustomDateEnd)
  };
};

const getDefaultAbstractionPeriodStartEnd = returnData => {
  const data = pick(
    returnData.metadata.nald,
    'periodEndDay',
    'periodEndMonth',
    'periodStartDay',
    'periodStartMonth'
  );
  return mapValues(data, parseInt);
};

/**
 * Gets period start/end from NALD metadata in return,
 * and converts to integers
 * @param {Object} data
 * @return {Object} only contains period start/end data as integers
 */
const getPeriodStartEnd = (data) => {
  return hasCustomAbstractionPeriod(data)
    ? getCustomAbstractionPeriodStartEnd(data)
    : getDefaultAbstractionPeriodStartEnd(data);
};

module.exports = {
  isDateWithinAbstractionPeriod,
  getPeriodStartEnd
};
