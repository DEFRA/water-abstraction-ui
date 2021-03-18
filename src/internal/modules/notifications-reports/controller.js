'use strict';

const Boom = require('@hapi/boom');

const services = require('../../lib/connectors/services');
const { mapMessage } = require('./lib/message-mapper');

/**
 * View list of notifications sent
 * @param {String} request.query.page - the page of results to fetch
 */
async function getNotificationsList (request, h) {
  const { page } = request.query;
  const { pagination, data } = await services.water.notifications.getNotifications(page);

  return h.view('nunjucks/notifications-reports/list', {
    ...request.view,
    pagination,
    events: data
  });
}

/**
 * View messages for a single event (batch of messages)
 * @param {request.params.id} the event ID
 */
async function getNotification (request, h) {
  const { id } = request.params;

  try {
    const [ event, { data: messages } ] = await Promise.all([
      await services.water.notifications.getNotification(id),
      await services.water.notifications.getNotificationMessages(id)
    ]);

    return h.view('nunjucks/notifications-reports/report', {
      ...request.view,
      event,
      messages: messages.map(mapMessage),
      back: '/notifications/report'
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return Boom.notFound(`Notification event ${id} not found`);
    }
    throw err;
  }
}

exports.getNotificationsList = getNotificationsList;
exports.getNotification = getNotification;
