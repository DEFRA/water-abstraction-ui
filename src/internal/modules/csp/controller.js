const moment = require('moment');
let dateCounts = {};

const postReport = async (request, h) => {
  const date = moment().format('YYYY-MM-DD');

  if (canLog(date, dateCounts) && request.payload.length < 3000) {
    dateCounts = incrementDateCount(date, dateCounts);
    request.log(['warn', 'csp'], request.payload.toString('utf-8'));
  }
  return dateCounts;
};

const canLog = (date, dateCounts) => {
  const count = dateCounts[date] || 0;
  return count < 100;
};

const incrementDateCount = (date, dateCounts) => {
  dateCounts[date] = (dateCounts[date] || 0) + 1;
  return dateCounts;
};

module.exports = {
  canLog,
  incrementDateCount,
  postReport
};
