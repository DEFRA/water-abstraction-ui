'use strict';

const { isNil } = require('lodash');
const moment = require('moment');

/**
 * Format a timestamp to YYYY
 * @param  {String|Number} value        - Timestamp / date (parsed by moment)
 * @return {String}              formatted date
 */
const year = (value) => {
  if (isNil(value)) {
    return undefined;
  }
  const m = moment(value);
  return m.isValid() ? m.format('YYYY') : undefined;
};

exports.year = year;
