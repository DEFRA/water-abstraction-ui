const Boom = require('boom');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const waterConnector = require('../../../lib/connectors/water');

/**
 * Loads the notification event from the water service
 * @param  {Object}  request - HAPI reque
 * @return {Promise}         resolves with a row of event data
 */
const loadEvent = async (request) => {
  const { eventId } = request.params;

  // Load event
  const { data: ev, error } = await waterConnector.events.findOne(eventId);
  throwIfError(error);

  // Check access
  const { username } = request.auth.credentials;
  if (ev.issuer !== username) {
    throw Boom.unauthorized(`User ${username} is not the issuer of event ${eventId}`);
  }

  // Check type is "notification"
  if (ev.type !== 'notification') {
    throw Boom.badRequest(`Event ${eventId} is not a notification`);
  }

  return ev;
};

/**
 * Loads messages for the specified event
 * @param  {Object} ev - event object loaded from water service
 * @return {Promise}
 */
const loadMessages = ev => {
  const filter = {
    event_id: ev.event_id
  };
  return waterConnector.notifications.findAll(filter);
};

module.exports = {
  loadEvent,
  loadMessages
};
