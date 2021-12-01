'use strict';

const Boom = require('@hapi/boom');

const services = require('../../lib/connectors/services');
const { mapMessage } = require('./lib/message-mapper');

const Joi = require('joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const forms = require('shared/lib/forms');
const { mapResponseToView } = require('./lib/message-mapper');

/**
 * Creates a form object for internal users to search by notification type and sent by email
 * number etc.
 * @param  {String} query - the search query entered by the user
 * @return {Object}       form object
 */
const searchForm = query => {
  const f = formFactory('/notifications', 'GET');

  f.fields.push(fields.text('sentBy', {
    widget: 'search',
    hint: 'Filter by sent by email',
    errors: {
      'string.empty': {
        message: 'Enter a Sent by email or select Notification type'
      }
    }
  }));

  f.fields.push(fields.radio('filter', {
    widget: 'search',
    hint: 'Filter by Notification type',
    errors: {
      'string.empty': {
        message: 'Enter a Sent by email or select Notification type'
      }
    }
  }));

  return setValues(f, { query });
};

const searchFormSchema = () => Joi.object().keys({
  page: Joi.number().integer().min(1).default(1),
  filter: [ Joi.array().optional(), Joi.string().allow('') ],
  sentBy: Joi.string().allow('')
});

async function getNotificationsList (request, h) {
  const { page, filter, sentBy } = request.query;
  let form = searchForm();
  const { view } = request;

  form = forms.handleRequest(form, request, searchFormSchema());
  const { pagination, data, notificationCategories } = await services.water.notifications.getNotifications(page, filter, sentBy);
  Object.assign(view, mapResponseToView(data, request, notificationCategories));
  view.form = form;

  return h.view('nunjucks/notifications-reports/list', {
    ...view,
    pagination,
    events: data,
    notificationCategories
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
