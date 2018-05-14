const { events } = require('../../lib/connectors/water');

/**
 * View list of notifications sent
 * @param {String} request.query.sort - the field to sort on
 * @param {Number} request.query.direction - +1 ascending, -1 descending
 */
async function getNotificationsList (request, reply) {
  const { sort, direction } = request.query;

  // Map URL to API fields
  const field = sort.replace('notification', 'subtype').replace('status', 'metadata->>error').replace('recipients', 'metadata->>recipients');

  const filter = {
    type: 'notification'
  };
  const sortParams = {
    [field]: direction
  };

  const { data, error, pagination } = await events.findMany(filter, sortParams);

  if (error) {
    return reply(error);
  }

  return reply.view('water/notifications-report/index', {
    ...request.view,
    pagination,
    events: data
  });
}

async function getNotification (request, response) {

}

module.exports = {
  getNotificationsList,
  getNotification
};
