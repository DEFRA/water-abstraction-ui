'use strict';

const Boom = require('@hapi/boom');

const services = require('../../lib/connectors/services');
const { mapMessage } = require('./lib/message-mapper');

const Joi = require('joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const forms = require('shared/lib/forms');
const { mapResponseToView } = require('./lib/message-mapper');
const session = require('./lib/session');

/**
 * Creates a form object for internal users to search by name, return, licence
 * number etc.
 * @param  {String} query - the search query entered by the user
 * @return {Object}       form object
 */
const searchForm = query => {
  const f = formFactory('/notifications', 'GET');

  f.fields.push(fields.text('query', {
    widget: 'search',
    hint: 'Filter by Notification type',
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
    },
    choices: [
      { value: 'notification_letter', label: 'Returns: send paper forms' },
      { value: 'returns_invitation_letter', label: 'Returns: invitation' },
      { value: 'returns_final_reminder', label: 'Returns: reminder' },
      { value: 'expiry_notification_email', label: 'Expiring licence(s): invitation to renew' },
      { value: 'water_abstraction_alert_reduce_warning', label: 'Hands off flow: levels warning' },
      { value: 'water_abstraction_alert_reduce_or_stop_warning', label: 'Hands off flow: stop or reduce abstraction' },
      { value: 'water_abstraction_alert_resume', label: 'Hands off flow: resume abstraction' },

      { value: 'water_abstraction_alert_stop_warning', label: 'Hands off flow: stop abstraction warning' },
      { value: 'water_abstraction_alert_reduce', label: 'Hands off flow: reduce abstraction' },
      { value: 'water_abstraction_alert_stop', label: 'Hands off flow: stop abstraction' }
    ]

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
  const { query } = forms.getValues(form);

  session.merge(request, {
    selected: filter
  });

  const { pagination, data } = await services.water.notifications.getNotifications(page, filter, sentBy);
  Object.assign(view, mapResponseToView(data, request), { query });
  view.form = form;

  return h.view('nunjucks/notifications-reports/list', {
    ...view,
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
