'use strict';

const moment = require('moment');

const formatPeriod = (inputStart = '', inputEnd = '') => {
  let tmpInputStart;
  let tmpInputEnd;
  let periodStart;
  let periodEnd;

  if (inputStart.indexOf('-') !== -1) {
    tmpInputStart = inputStart.split('-')[0] + '/' + inputStart.split('-')[1] + '/2000';
    tmpInputEnd = inputEnd.split('-')[0] + '/' + inputEnd.split('-')[1] + '/2000';
    periodStart = moment(tmpInputStart, 'DD/MMM/YYYY');
    periodEnd = moment(tmpInputEnd, 'DD/MMM/YYYY');
  } else {
    tmpInputStart = inputStart + '/2000';
    tmpInputEnd = inputEnd + '/2000';
    periodStart = moment(tmpInputStart, 'DD/MM/YYYY');
    periodEnd = moment(tmpInputEnd, 'DD/MM/YYYY');
  }
  return 'From ' + periodStart.format('D MMMM') + ' until ' + periodEnd.format('D MMMM');
};

module.exports = formatPeriod;
