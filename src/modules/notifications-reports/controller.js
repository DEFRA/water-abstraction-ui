const { events } = require('../../lib/connectors/water');

/**
 * View list of notifications sent
 */
async function getNotificationsList (request, reply) {
  const filter = {
    type: 'notification'
  };
  const sort = {
    created: -1
  };

  const { data, error, pagination } = await events.findMany(filter, sort);

  if (error) {
    return reply(error);
  }

  return reply.view('water/notifications-report/index', {
    ...request.view,
    events: data
  });
}

async function getNotification (request, response) {

}

module.exports = {
  getNotificationsList,
  getNotification
};
