const moment = require('moment');
const { isDateWithinAbstractionPeriod } = require('@envage/water-abstraction-helpers').returns.date;

const getDay = date => moment(date, 'YYYY-MM-DD').date();
const getMonth = date => moment(date, 'YYYY-MM-DD').month() + 1;

module.exports = {
  isDateWithinAbstractionPeriod,
  getDay,
  getMonth
};
