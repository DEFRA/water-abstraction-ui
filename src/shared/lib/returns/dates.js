'use strict';

const moment = require('moment');

const isReturnPastDueDate = returnRow => {
  const dueDate = moment(returnRow.due_date, 'YYYY-MM-DD');
  const today = moment().startOf('day');
  return dueDate.isBefore(today);
};

exports.isReturnPastDueDate = isReturnPastDueDate;
