'use strict';

const { isNil } = require('lodash');
const moment = require('moment');

/**
 * Format a timestamp
 * @param  {String|Number} value        - Timestamp / date (parsed by moment)
 * @param  {String} [format='DDD MMM YYYY'] - Format (see moment docs)
 * @return {String}              formatted date
 */
const date = (value, format = 'D MMMM YYYY') => {
  if (isNil(value)) {
    return undefined;
  }
  const m = moment(value);
  return m.isValid() ? m.format(format) : undefined;
};

exports.date = date;
