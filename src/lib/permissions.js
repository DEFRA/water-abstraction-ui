/**
 * Permissions module
 *
 * A single piece of permissions logic in the getPermissions function below can
 * be used both in the view layer and to protect routes.
 * Generates a hash of permissions for the current authenticated user
 * this is attached to the current request so that it can be used within
 * the view layer.
 * It also exports a function getPermissionsCb which can be used by the hapi-route-acl
 * plugin.
 *
 * @module lib/permissions
 */

/**
 * Gets permissions available to current user based on current HAPI request
 * @param {Object} credentials - credentials from HAPI request
 * @return {Object} permissions - permissions object
 */
async function getPermissions (credentials) {
  // Default permissions
  const permissions = {
    licences: {
      read: false,
      edit: false
    }
  };

  if (credentials) {
    const { roles, entity_id: entityId } = credentials;

    if (entityId) {
      permissions.licences.read = true;
    }
    if (roles.length === 1 && roles[0].role === 'primary_user') {
      permissions.licences.edit = true;
    }
  }

  return permissions;
}

/**
 * Get permissions - callback style
 * @param {Object} credentials - credentials from HAPI request
 * @return {Object} permissions - permissions object
 */
function getPermissionsCb (credentials, cb) {
  getPermissions(credentials)
    .then((permissions) => {
      cb(null, permissions);
    })
    .catch((err) => {
      cb(err, null);
    });
}

/**
 * Plugin code to hook in above permissions method to HAPI request
 */
const plugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      method (request, reply) {
        // Get permissions for current user
        getPermissionsCb(request.auth.credentials, (err, permissions) => {
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

    next();
  }
};

plugin.register.attributes = {
  name: 'permissionsPlugin',
  version: '1.0.0'
};

module.exports = {
  getPermissions,
  getPermissionsCb,
  plugin
};
