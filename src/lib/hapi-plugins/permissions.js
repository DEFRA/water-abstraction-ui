/**
 * Plugin to decorate request with current user's permissions
 */
const { getPermissions, getCompanyPermissions } = require('../permissions');
const Boom = require('boom');
const { get, isBoolean } = require('lodash');

/**
 * Checks whether the user has a particular permission
 * if the permission string is invalid an error is thrown
 * @param {String} permission - the permission string, e.g. admin.defra
 * @param {Object} permissions - the permissions object
 * @return {Boolean}
 */
const hasPermission = (permission, permissions) => {
  const isGranted = get(permissions, permission);
  if (!isBoolean(isGranted)) {
    throw Boom.badImplementation(`Attempt to check invalid permission ${permission}`);
  }
  return isGranted;
};

const permissionsPlugin = {

  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: (request, reply) => {
        request.permissions = getPermissions(request.state.sid);
        request.permissions.companies = getCompanyPermissions(request.state.sid);

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
