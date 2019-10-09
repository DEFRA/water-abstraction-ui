'use strict';

const moment = require('moment');

const changeDateFormatting = (dateInput, inputFormat, outputFormat = 'D MMMM YYYY') => {
  const date = moment(dateInput, inputFormat);
  return date.isValid() ? date.format(outputFormat) : dateInput;
};

const formatSortableDate = dateInput => changeDateFormatting(dateInput, 'YYYYMMDD');

module.exports = formatSortableDate;
