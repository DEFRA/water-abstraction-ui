const services = require('../../lib/connectors/services');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const { get } = require('lodash');
const { logger } = require('../../logger');
const Boom = require('@hapi/boom');

const getPageTitle = (ev) => {
  const name = get(ev, 'subtype');
  const config = {
    returnReminder: 'Send returns reminders',
    returnInvitation: 'Send returns invitations'
  };
  return config[name];
};

const getRegionName = (regionsArray, regionId) => {
  // const result = words.filter(word => word.length > 6);
  const [ region ] = regionsArray.filter(region => region.regionId === regionId);
  console.log(region);
  return region.name;
};

const handleProcessing = (request, h, event) => {
  // Still processing, render the template which will refresh in 5 seconds.
  const view = {
    ...request.view,
    pageTitle: getPageTitle(event),
    text: 'Please wait while the mailing list is assembled. This may take a few minutes. The letters will not be sent yet.'
  };
  return h.view('nunjucks/waiting/index', view);
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

const handleBillRunProcessing = (request, h, event) => {
  // Still processing, render the template which will refresh in 5 seconds.
  // clean up the type of bill run text for the ui if two-part tariff
  event.subtype = (event.subtype === 'two_part_tariff') ? 'two-part tariff' : event.subtype;
  const view = {
    ...request.view,
    pageTitle: 'A bill run is being processed',
    text: `Please wait while the ${event.subtype} bill run is being prepared for the ${event.metadata.batch.region_name} region. This may take a few minutes.`
  };
  return h.view('nunjucks/waiting/index', view);
};

const handleBillRunProcessed = (request, h, event) => {
  // Redirect to a new page showing a send button and a means
  // of acquiring a csv download of all the recipients.
  const { event_id: eventId } = event;
  return h.redirect(`/billing/batch/summary?eventId=${eventId}`);
};

const handleBillRunError = (request, h) => {
  throw Boom.badImplementation('Errored event.');
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

const billrunsubTypeHandler = {
  billing: {
    processing: handleBillRunProcessing,
    complete: handleBillRunProcessed,
    error: handleBillRunError
  }
};

const getEventHandler = event => {
  if (event.type === 'billing-batch') {
    event.status = (event.status === 'batch:complete') ? 'complete' : event.status;
    event.status = (event.status === 'batch:start') ? 'processing' : event.status;
    return get(billrunsubTypeHandler, ['billing', event.status]);
  }
  return get(subTypeHandlers, [event.subtype, event.status]);
};

const getWaiting = async (request, h) => {
  const { eventId } = request.params;
  const { data: event, error } = await services.water.events.findOne(eventId);

  if (event.type === 'billing-batch') {
    const { data } = await services.water.billingBatchCreateService.getBillingRegions();
    event.metadata.batch.region_name = getRegionName(data, event.metadata.batch.region_id);
  }

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
