const moment = require('moment');

/**
 * Determines whether re-authorisation is required.
 * This will be true if expiry time not set, or in the past
 * @param {String|undefined} expiryTime
 * @return {Boolean}
 */
const isExpired = expiryTime => {
  if (!expiryTime) {
    return true;
  }
  return moment().isAfter(expiryTime);
};

const getExpiryTime = now => moment(now).add(10, 'minute').format();

exports.isExpired = isExpired;
exports.getExpiryTime = getExpiryTime;
