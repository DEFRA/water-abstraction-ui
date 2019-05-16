const moment = require('moment');

/**
 * Formats an abstraction period in the form day/month, e.g. 1/4
 * to a readable form, e.g. 1 April
 * @param  {String} str - day and month string
 * @return {String}     - readable day and month string
 */
const abstractionPeriod = (str) => {
  if (str === null) {
    return null;
  }
  const m = moment(str, 'D/M');
  if (!m.isValid()) {
    throw new Error(`Invalid abstraction period ${str} in abstractionPeriod filter`);
  }
  return m.format('D MMMM');
};

module.exports = {
  abstractionPeriod
};
