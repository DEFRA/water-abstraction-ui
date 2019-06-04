const { events, taskConfig, notifications } = require('../../lib/connectors/water');
const { notifyToBadge } = require('./badge-status');

/**
 * View list of notifications sent
 * @param {String} request.query.sort - the field to sort on
 * @param {Number} request.query.direction - +1 ascending, -1 descending
 */
async function getNotificationsList (request, h) {
  const { sort, direction } = request.query;

  // Map URL to API fields
  const field = sort.replace('notification', 'subtype').replace('status', 'metadata->>error').replace('recipients', 'metadata->>recipients');

  const filter = {
    type: 'notification',
    status: {
      $in: ['sent', 'completed', 'sending']
    }
  };
  const sortParams = {
    [field]: direction
  };

  const { data, error, pagination } = await events.findMany(filter, sortParams);

  if (error) {
    return h(error);
  }

  return h.view('nunjucks/notifications-reports/list.njk', {
    ...request.view,
    pagination,
    events: data
  }, { layout: false });
}

async function getNotification (request, h) {
  const { id } = request.params;

  // Load event
  const { error, data: event } = await events.findOne(id);

  if (error) {
    h(error);
  }

  // Load task config
  const { metadata: { taskConfigId } } = event;
  const { error: taskError, data: task } = await taskConfig.findOne(taskConfigId);

  if (taskError) {
    return h(taskError);
  }

  // Load scheduled notifications
  const { error: notificationError, data: messages } = await notifications.findMany({ event_id: event.event_id });
  if (notificationError) {
    return h(notificationError);
  }

  return h.view('nunjucks/notifications-reports/report.njk', {
    ...request.view,
    event,
    task,
    messages: messages.map(message => Object.assign(message, {
      badgeStatus: notifyToBadge(message.status)
    })),
    back: '/admin/notifications/report'
  }, { layout: false });
}

exports.getNotificationsList = getNotificationsList;
exports.getNotification = getNotification;
