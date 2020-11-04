'use strict';

const { errorHandler } = require('./lib/error-handler');

/**
 * Pre-handler to load water service event
 * @param {Object} request
 * @return {Promise<Object>}
 */
const loadEvent = async request => {
  const { eventId } = request.params;
  try {
    const { data: event } = await request.services.water.events.findOne(eventId);
    return event;
  } catch (err) {
    return errorHandler(err, `Event ${eventId} not found`);
  }
};

exports.loadEvent = loadEvent;
