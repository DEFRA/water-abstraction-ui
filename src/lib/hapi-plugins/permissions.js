/**
 * Plugin to decorate request with current user's permissions
 */
const { getPermissions, getCompanyPermissions, hasPermission } = require('../permissions');

const permissionsPlugin = {

  register: (server, options) => {
    server.dependency('entityRolesPlugin');

    server.ext({
      type: 'onPostAuth',
      method: (request, reply) => {
        request.permissions = getPermissions(request.state.sid, request.entityRoles);
        request.permissions.companies = getCompanyPermissions(request.state.sid, request.entityRoles);

        /**
         * Checks whether the user has the requested permission
         * @param {String} permission, .e.g admin.defra
         * @return {Boolean} whether user has that permission
         */
        request.permissions.hasPermission = permission => {
          return hasPermission(permission, request.permissions);
        };

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
module.exports.hasPermission = hasPermission;
