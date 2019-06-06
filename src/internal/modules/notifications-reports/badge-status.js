const statusMap = {
  error: 'error',
  'permanent-failure': 'error',
  'temporary-failure': 'error',
  'technical-failure': 'error'
};

const textMap = {
  error: 'Error',
  'permanent-failure': 'Error',
  'temporary-failure': 'Error',
  'technical-failure': 'Error',
  delivered: 'Sent',
  received: 'Sent',
  accepted: 'Sent'
};

const getBadgeStatus = notifyStatus => {
  return statusMap[notifyStatus] || 'completed';
};

const getBadgeText = notifyStatus => {
  return textMap[notifyStatus] || 'Pending';
};

/**
 *
 * @param {String} status The current notify status
 * @returns {Object} An object with the text and badge class used to represent the notify status.
 */
const notifyToBadge = status => {
  return {
    text: getBadgeText(status),
    status: getBadgeStatus(status)
  };
};

exports.notifyToBadge = notifyToBadge;
