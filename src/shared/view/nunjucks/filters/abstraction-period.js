const moment = require('moment');
const { isObject, isString } = require('lodash');

const formatDate = (day, month) => {
  const m = moment(`${day}/${month}`, 'D/M');
  if (!m.isValid()) {
    throw new Error(`Invalid abstraction period ${day}/${month} in abstractionPeriod filter`);
  }
  return m.format('D MMMM');
};

/**
 * Formats an abstraction period in the form day/month, e.g. 1/4
 * to a readable form, e.g. 1 April
 * @param  {String|Object} val - day and month string
 * @return {String}     - readable day and month string
 */
const abstractionPeriod = val => {
  if (isObject(val)) {
    const dates = [
      formatDate(val.startDay, val.startMonth),
      formatDate(val.endDay, val.endMonth)
    ];
    return dates.join(' to ');
  }
  if (isString(val)) {
    const [day, month] = val.split('/');
    return formatDate(day, month);
  }
};

exports.abstractionPeriod = abstractionPeriod;
