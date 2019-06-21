/**
 * Helper functions for calculating the URL paths to returns
 */
const moment = require('moment');

const getReturnId = ret => ret.returnId || ret.return_id;
const getEndDate = ret => ret.endDate || ret.end_date;
const isCompleted = ret => (ret.status === 'completed');
const isDue = ret => (ret.status === 'due');
const isVoid = ret => (ret.status === 'void');
const isAfterSummer2018 = ret => moment(getEndDate(ret)).isSameOrAfter('2018-10-31', 'day');
const isEndDatePast = ret => moment().isSameOrAfter(getEndDate(ret), 'day');

exports.getReturnId = getReturnId;
exports.getEndDate = getEndDate;
exports.isCompleted = isCompleted;
exports.isDue = isDue;
exports.isVoid = isVoid;
exports.isAfterSummer2018 = isAfterSummer2018;
exports.isEndDatePast = isEndDatePast;
