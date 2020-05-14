'use strict';

const services = require('../../lib/connectors/services');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const { get } = require('lodash');
const Boom = require('@hapi/boom');
const { logger } = require('../../logger');
const path = require('path');

const getRedirectPath = (eventStatuses, ev) => {
  if (ev.status in eventStatuses) {
    return path.join(eventStatuses[ev.status], ev.event_id || ev.id);
  }
};

const getWaitingForNotifications = async (request, h, event) => {
  const path = getRedirectPath(
    { processed: '/batch-notifications/review' },
    event
  );

  if (path) {
    return h.redirect(path);
  }

  const view = {
    ...request.view,
    pageTitle: getNotificationsTitle(event),
    text: 'Please wait while the mailing list is assembled. This may take a few minutes. The letters will not be sent yet.',
    waitingType: 'returns'
  };

  return h.view('nunjucks/waiting/index', view);
};

const getNotificationsTitle = (ev) => {
  const name = get(ev, 'subtype');
  const config = {
    returnReminder: 'Send returns reminders',
    returnInvitation: 'Send returns invitations'
  };
  return config[name];
};

const handlers = {
  notification: getWaitingForNotifications
};

const getWaiting = async (request, h) => {
  const { eventId } = request.params;
  const { data: event, error } = await services.water.events.findOne(eventId);

  if (error) {
    const message = 'Unknown event type';
    logger.error(message, error, { params: event });
    throw new Error('Unknown event type');
  }
  throwIfError(error);

  if (event.status === 'error') {
    throw Boom.badImplementation('Errored event.');
  }

  return handlers[event.type](request, h, event);
};

exports.getWaiting = getWaiting;
