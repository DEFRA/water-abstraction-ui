const moment = require('moment');

const isFirstDayOfMonth = date => {
  return moment(date).startOf('month').isSame(date, 'day');
};

const isLastDayOfMonth = date => {
  return moment(date).endOf('month').isSame(date, 'day');
};

const returnPeriod = (startDate, endDate) => {
  const startDateFormat = isFirstDayOfMonth(startDate) ? 'MMMM YYYY' : 'D MMMM YYYY';
  const endDateFormat = isLastDayOfMonth(endDate) ? 'MMMM YYYY' : 'D MMMM YYYY';

  return `${moment(startDate).format(startDateFormat)} to ${moment(endDate).format(endDateFormat)}`;
};

exports.returnPeriod = returnPeriod;
