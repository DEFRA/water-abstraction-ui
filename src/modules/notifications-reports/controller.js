const { events, taskConfig, notifications } = require('../../lib/connectors/water');

/**
 * View list of notifications sent
 * @param {String} request.query.sort - the field to sort on
 * @param {Number} request.query.direction - +1 ascending, -1 descending
 */
async function getNotificationsList (request, reply) {
  const { sort, direction } = request.query;

  // Map URL to API fields
  const field = sort.replace('notification', 'subtype').replace('status', 'metadata->>error').replace('recipients', 'metadata->>recipients');

  const filter = {
    type: 'notification'
  };
  const sortParams = {
    [field]: direction
  };

  const { data, error, pagination } = await events.findMany(filter, sortParams);

  if (error) {
    return reply(error);
  }

  return reply.view('water/notifications-report/index', {
    ...request.view,
    pagination,
    events: data
  });
}

/**
 * View messages for a single event (batch of messages)
 * @param {request.params.id} the event ID
 */
async function getNotification (request, reply) {
  const { id } = request.params;

  // Load event
  const { error, data: event } = await events.findOne(id);

  if (error) {
    reply(error);
  }

  // Load task config
  const { metadata: { taskConfigId } } = event;
  const { error: taskError, data: task } = await taskConfig.findOne(taskConfigId);

  if (taskError) {
    return reply(taskError);
  }

  // Load scheduled notifications
  const { error: notificationError, data: messages } = await notifications.findMany({ event_id: event.event_id });
  if (notificationError) {
    return reply(notificationError);
  }

  return reply.view('water/notifications-report/view', {
    ...request.view,
    event,
    task,
    messages
  });
}

module.exports = {
  getNotificationsList,
  getNotification
};
