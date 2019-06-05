const moment = require('moment');

/**
 * Format a timestamp
 * @param  {String} value        - Timestamp / date (parsed by moment)
 * @param  {String} [format='DDD MMM YYYY'] - Format (see moment docs)
 * @return {String}              formatted date
 */
const date = (value, format = 'D MMMM YYYY') => {
  const m = moment(value);
  return m.isValid() ? m.format(format) : null;
};

module.exports = {
  date
};
