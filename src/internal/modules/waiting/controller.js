const water = require('../../lib/connectors/water');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const { get } = require('lodash');
const { logger } = require('../../logger');
const Boom = require('boom');

const getPageTitle = (ev) => {
  const name = get(ev, 'subtype');
  const config = {
    returnReminder: 'Send returns reminders',
    returnInvitation: 'Send returns invitations'
  };
  return config[name];
};

const handleProcessing = (request, h, event) => {
  // Still processing, render the template which will refresh in 5 seconds.
  const view = {
    ...request.view,
    pageTitle: getPageTitle(event),
    text: 'Please wait while the mailing list is assembled. This may take a few minutes. The letters will not be sent yet.'
  };
  return h.view('nunjucks/waiting/index.njk', view, { layout: false });
};

const handleReturnReminderError = (request, h) => {
  throw Boom.badImplementation('Errored event.');
};

const handleReturnsRemindersProcessed = (request, h, event) => {
  // Redirect to a new page showing a send button and a means
  // of acquiring a csv download of all the recipients.
  const { event_id: eventId } = event;
  return h.redirect(`/batch-notifications/review/${eventId}`);
};

const subTypeHandlers = {
  returnReminder: {
    processing: handleProcessing,
    processed: handleReturnsRemindersProcessed,
    error: handleReturnReminderError
  },
  returnInvitation: {
    processing: handleProcessing,
    processed: handleReturnsRemindersProcessed,
    error: handleReturnReminderError
  }
};

const getEventHandler = event => {
  return get(subTypeHandlers, [event.subtype, event.status]);
};

const getWaiting = async (request, h) => {
  const { eventId } = request.params;
  const { data: event, error } = await water.events.findOne(eventId);

  throwIfError(error);

  const handler = getEventHandler(event);

  if (!handler) {
    const message = 'Unknown event type';
    logger.error(message, { params: event });
    throw new Error('Unknown event type');
  }

  return handler(request, h, event);
};

exports.getWaiting = getWaiting;
