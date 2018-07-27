/**
 * Plugin to decorate request with current user's permissions
 */
const { getPermissions } = require('../permissions');

const permissionsPlugin = {

  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: (request, reply) => {
        request.permissions = getPermissions(request.state.sid);
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'permissionsPlugin',
    version: '2.0.0'
  }
};

module.exports = permissionsPlugin;
