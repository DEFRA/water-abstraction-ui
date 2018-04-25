/**
 * Renders page with list of notifications that can be selected
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function getIndex (request, reply) {
  return reply.view('water/notifications/index', request.view);
}

module.exports = {
  getIndex
};
