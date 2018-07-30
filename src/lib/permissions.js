'use strict';

const { intersection } = require('lodash');
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

const hasMatch = (requiredScopes, userScopes) => intersection(requiredScopes, userScopes).length > 0;

const isExternal = (scope = []) => scope.includes('external');
const isVmlAdmin = (scope = []) => hasMatch(['internal', 'ar_user', 'ar_approver'], scope);
const isPrimaryUser = (roles = []) => !!roles.find(role => role.role === 'primary_user');

const canReadLicence = entityId => !!entityId;
const canEditAbstractionReform = (scope = []) => hasMatch(['ar_user', 'ar_approver'], scope);

const canApproveAbstractionReform = (scope = []) => scope.includes('ar_approver');

const canEditLicence = (scope = [], roles = []) => {
  return isExternal(scope) && roles.length === 1 && isPrimaryUser(roles);
};

const canViewMutlipleLicences = (scope = [], roles = []) => {
  return isExternal(scope) && countRoles(roles, ['user', 'primary_user']) > 1;
};

/**
 * Gets permissions available to current user based on current HAPI request
 * @param {Object} credentials - credentials from HAPI request
 * @return {Object} permissions - permissions object
 */
const getPermissions = (credentials = {}) => {
  const { roles, entity_id: entityId, scope } = credentials;

  return {
    licences: {
      read: canReadLicence(entityId),
      edit: canEditLicence(scope, roles),
      multi: canViewMutlipleLicences(scope, roles)
    },
    admin: {
      defra: isVmlAdmin(scope)
    },
    ar: {
      read: canEditAbstractionReform(scope),
      edit: canEditAbstractionReform(scope),
      approve: canApproveAbstractionReform(scope)
    }
  };
};

module.exports = {
  getPermissions
};
