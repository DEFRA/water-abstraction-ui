'use strict';

const moment = require('moment');

const validityMessageMap = new Map()
  .set('expiredDate', 'expired on')
  .set('lapsedDate', 'lapsed on')
  .set('revokedDate', 'was revoked on');

const formatDate = date => moment(date).format('D MMMM YYYY');

/**
 * Gets a message if the licence is future-dated / ended
 * @param {Object} licence
 * @param {String} [refDate]
 * @returns {String}
 */
const getValidityNotice = (licence, refDate) => {
  const { isFutureDated, startDate, endDate, endDateReason } = licence;
  if (isFutureDated) {
    return `This licence starts on ${formatDate(startDate)}`;
  }
  if (moment(refDate).isAfter(endDate, 'day')) {
    return `This licence ${validityMessageMap.get(endDateReason)} ${formatDate(endDate)}`;
  }
};

exports.getValidityNotice = getValidityNotice;
