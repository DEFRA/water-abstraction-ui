'use strict';

const titleCase = require('title-case');

const uiStatus = {
  pending: 'pending',
  sent: 'sent',
  error: 'error'
};

const statusMap = new Map()
  .set('draft', uiStatus.pending)
  .set('sending', uiStatus.pending)
  .set('sent', uiStatus.sent)
  .set('error', uiStatus.error);

const notifyStatusMap = new Map()
  .set('permanent-failure', uiStatus.error)
  .set('temporary-failure', uiStatus.error)
  .set('technical-failure', uiStatus.error)
  .set('validation-failed', uiStatus.error)
  .set('sending', uiStatus.pending)
  .set('delivered', uiStatus.sent)
  .set('received', uiStatus.sent)
  .set('accepted', uiStatus.sent);

const messageStatusMapper = message =>
  notifyStatusMap.get(message.notify_status) || statusMap.get(message.status);

const badgeStatusMap = new Map()
  .set('error', 'error')
  .set('sent', 'completed');

const messageStatusBadgeMapper = message => {
  const status = messageStatusMapper(message);
  return {
    text: titleCase(status),
    status: badgeStatusMap.get(status)
  };
};

const mapMessage = message => ({
  ...message,
  badge: messageStatusBadgeMapper(message)
});

exports.mapMessage = mapMessage;
