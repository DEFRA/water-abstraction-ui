'use strict';

const titleCase = require('title-case');

const badgeStatusMap = new Map()
  .set('error', 'error');

/**
   * Maps the displayStatus from the water service to a badge
   * object which will render via Nunjucks
   *
   * @param {String} status
   */
const messageStatusBadgeMapper = status => {
  return {
    text: titleCase(status),
    status: badgeStatusMap.get(status)
  };
};

const mapMessage = message => ({
  ...message,
  badge: messageStatusBadgeMapper(message.displayStatus)
});

exports.mapMessage = mapMessage;
