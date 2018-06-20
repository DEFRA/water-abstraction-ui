/**
 * Plugin to decorate request with current user's permissions
 */
const { getPermissionsCb } = require('../permissions');

const permissionsPlugin = {

  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method (request, reply) {
        // Get permissions for current user
        getPermissionsCb(request.state.sid, (err, permissions) => {
          if (err) {
            reply(err);
          } else {
            // Attach permissions to request
            request.permissions = permissions;
          }
          reply.continue();
        });
      }
    });
  },

  pkg: {
    name: 'permissionsPlugin',
    version: '2.0.0'
  }
};

module.exports = permissionsPlugin;
