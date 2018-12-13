const moment = require('moment');

/**
 * Format a timestamp
 * @param  {String} value        - Timestamp / date (parsed by moment)
 * @param  {String} [format='DDD MMM YYYY'] - Format (see moment docs)
 * @return {String}              formatted date
 */
const date = (value, format = 'D MMMM YYYY') => {
  return moment(value).format(format);
};

module.exports = {
  date
};
