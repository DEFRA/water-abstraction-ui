'use strict';

const moment = require('moment');

const formatToDate = (dateInput, defaultValue) => {
  if (dateInput === null) {
    return defaultValue;
  }

  let date = moment(dateInput, 'MM/DD/YYYY');

  if (!date.isValid()) {
    date = moment(dateInput, 'DD/MM/YYYY');
  }

  return date.isValid() ? date.format('D MMMM YYYY') : dateInput;
};

module.exports = formatToDate;
