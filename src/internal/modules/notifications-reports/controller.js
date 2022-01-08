'use strict';

const Boom = require('@hapi/boom');
const formHandler = require('shared/lib/form-handler');
const notificationFilteringForm = require('./forms/notifications-filtering');
const services = require('../../lib/connectors/services');
const { mapMessage } = require('./lib/message-mapper');
const session = require('./lib/session');

/**
 * View list of notifications sent
 * @param {String} request.query.page - the page of results to fetch
 */
async function getNotificationsList (request, h) {
  const { page } = request.query;
  const { categories, sender } = session.get(request);
  const { pagination, data } = await services.water.notifications.getNotifications(page, categories, sender);
  const form = formHandler.handleFormRequest(request, notificationFilteringForm);

  return h.view('nunjucks/notifications-reports/list', {
    ...request.view,
    pagination,
    events: data,
    form,
    back: '/manage',
    filtersSegmentOpen: (!!categories || !!sender || form.isValid === false)
  });
}

const postNotificationListSearch = (request, h) => {
  const { categories, sender } = request.payload;

  const form = formHandler.handleFormRequest(request, notificationFilteringForm);
  session.merge(request, { categories, senderInputValue: sender });
  if (!form.isValid) {
    return h.postRedirectGet(form);
  } else {
    session.merge(request, { sender });
    return h.redirect(request.path);
  }
};

/**
 * View messages for a single event (batch of messages)
 * @param {request.params.id} the event ID
 */
async function getNotification (request, h) {
  const { id } = request.params;

  try {
    const [event, { data: messages }] = await Promise.all([
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
exports.postNotificationListSearch = postNotificationListSearch;
exports.getNotification = getNotification;
