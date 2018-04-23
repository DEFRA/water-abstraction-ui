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
 * Gets user-type role count from roles array
 * @param {Array} roles - array of roles loaded from CRM
 * @param {String|Array} type - the role type or types to match
 * @return {Number} number of roles of specified type
 */
function countRoles (roles, type) {
  // Handle array or string
  const types = typeof (type) === 'string' ? [type] : type;
  return roles.reduce((memo, role) => {
    return types.includes(role.role) ? memo + 1 : memo;
  }, 0);
}

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
      edit: false,

      // Agents can view licences for multiple licence holders
      // this flag is set to true
      multi: false
    },
    admin: {
      defra: false,
      project: false,
      system: false
    },
    ar: {
      admin: false,
      approver: false,
      user: false
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
    if (countRoles(roles, ['user', 'primary_user']) > 1) {
      permissions.licences.multi = true;
    }
    const isDefraAdmin = roles.find(r => r.role === 'admin');
    if (isDefraAdmin) {
      permissions.admin.defra = true;
    }
    const isProjectAdmin = roles.find(r => r.role === 'project_admin');
    if (isProjectAdmin) {
      permissions.admin.project = true;
    }
    const isSysAdmin = roles.find(r => r.role === 'system_admin');
    if (isSysAdmin) {
      permissions.admin.system = true;
    }
    const isArAdmin = roles.find(r => r.role === 'ar_admin');
    if (isArAdmin) {
      permissions.ar.admin = true;
    }

    const isArApprover = roles.find(r => r.role === 'ar_approver');
    if (isArApprover) {
      permissions.ar.approver = true;
    }

    const isArUser = roles.find(r => r.role === 'ar_user');
    if (isArUser) {
      permissions.ar.user = true;
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
