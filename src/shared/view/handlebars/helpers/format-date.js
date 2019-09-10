'use strict';

const moment = require('moment');

const formatDate = dateInput => {
  let date = moment(dateInput, 'DD/MM/YYYY');
  let isFutureDate = moment().isBefore(date);
  if (isFutureDate) {
    date.subtract('year', 100);
  }
  return date.isValid() ? date.format('D MMMM YYYY') : dateInput;
};

module.exports = formatDate;
