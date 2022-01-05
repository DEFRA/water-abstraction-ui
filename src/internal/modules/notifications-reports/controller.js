'use strict';

const Boom = require('@hapi/boom');

const services = require('../../lib/connectors/services');
const { mapMessage } = require('./lib/message-mapper');

const Joi = require('joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { mapResponseToView } = require('./lib/message-mapper');

const { handleRequest, applyErrors } = require('shared/lib/forms');

/**
 * Creates a form object for internal users to search by notification type and sent by email
 * number etc.
 * @param  {String} query - the search query entered by the user
 * @return {Object}       form object
 */
const searchForm = (request, data = {}) => {
  const f = formFactory('/notifications', 'GET');

  f.fields.push(fields.text('sentBy', {
    widget: 'search',
    hint: 'Filter by sent by email',
    errors: {
      'string.email': {
        message: 'Enter a valid email'
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

  return setValues(f, data);
};

const searchFormSchema = () => Joi.object().keys({
  page: Joi.number().integer().min(1).default(1),
  filter: [Joi.array().optional(), Joi.string().allow('')],
  sentBy: Joi.string().trim().email().allow('')
});

async function getNotificationsList (request, h) {
  const { page = '1', filter } = request.query;
  const { sentBy = '' } = request.query;
  const { view } = request;
  const form = handleRequest(searchForm(request, {}), request, searchFormSchema(), {
    abortEarly: true
  });
  const { errors } = form;

  let sentByQuery = sentBy.trim();
  let filterQuery = filter;
  let thisFormWithCustomErrors = form;
  if (!form.isValid) {
    errors.some(error => {
      if (error.name === 'sentBy') {
        thisFormWithCustomErrors = applyErrors(form, [{ name: 'sentBy', summary: 'Invalid email entered' }]);
        sentByQuery = ''; // do not search with invalid query
      }
      if (error.name === 'filter') {
        thisFormWithCustomErrors = applyErrors(form, [{ name: 'filter', summary: 'Invalid filter selected' }]);
        filterQuery = ''; // do not search with invalid query
      }
    });
  }

  const {
    pagination,
    data,
    notificationCategories
  } = await services.water.notifications.getNotifications(page, filterQuery, sentByQuery);
  pagination.next = parseInt(page) + 1;
  pagination.previous = parseInt(page) - 1;
  Object.assign(view, mapResponseToView(data, request, notificationCategories, sentBy));
  view.form = form;

  if (!form.isValid) {
    thisFormWithCustomErrors.isValid = false;
    view.form = thisFormWithCustomErrors;
  }

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
exports.getNotification = getNotification;
