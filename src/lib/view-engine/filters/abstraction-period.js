const moment = require('moment');

/**
 * Formats an abstraction period in the form day/month, e.g. 1/4
 * to a readable form, e.g. 1 April
 * @param  {String} str - day and month string
 * @return {String}     - readable day and month string
 */
const abstractionPeriod = (str) => {
  const [day, month] = str.split('/');
  const m = moment().month(month - 1).date(day);
  return m.format('D MMMM');
};

module.exports = {
  abstractionPeriod
};
