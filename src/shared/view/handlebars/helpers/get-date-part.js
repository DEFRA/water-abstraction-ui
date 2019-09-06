'use strict';

const { splitString } = require('../../../lib/string-formatter');
const { isString } = require('lodash');

const getDatePartFromString = (date, part) => {
  const indexes = { year: 0, month: 1, day: 2 };
  return splitString(date, indexes[part], '-');
};

const getDatePartFromDate = (date, part) => {
  let datePart;

  if (part === 'year') {
    datePart = date.getFullYear();
  }

  if (part === 'month') {
    datePart = date.getMonth() + 1;
  }

  if (part === 'day') {
    datePart = date.getDate();
  }

  return datePart.toString();
};

const getDatePart = (date, part) => {
  if (!['day', 'month', 'year'].includes(part)) {
    const err = 'Unknown date part requested. Supports day, month and year';
    throw new Error(err);
  }

  if (date) {
    const func = isString(date) ? getDatePartFromString : getDatePartFromDate;
    return func(date, part);
  }
};

module.exports = getDatePart;
