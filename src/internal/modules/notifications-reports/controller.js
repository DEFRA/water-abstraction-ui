'use strict';

const services = require('../../lib/connectors/services');
const { mapMessage } = require('./lib/message-mapper');

/**
 * View list of notifications sent
 * @param {String} request.query.page - the page of results to fetch
 */
async function getNotificationsList (request, reply) {
  const { page } = request.query;
  const { pagination, data } = await services.water.notifications.getNotifications(page);

  return reply.view('nunjucks/notifications-reports/list', {
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
  const { error, data: event } = await services.water.events.findOne(id);

  if (error) {
    reply(error);
  }

  // Load scheduled notifications
  const { error: notificationError, data: messages } = await services.water.notifications.findMany({ event_id: event.event_id });
  if (notificationError) {
    return reply(notificationError);
  }

  return reply.view('nunjucks/notifications-reports/report', {
    ...request.view,
    event,
    messages: messages.map(mapMessage),
    back: '/notifications/report'
  });
}

exports.getNotificationsList = getNotificationsList;
exports.getNotification = getNotification;
