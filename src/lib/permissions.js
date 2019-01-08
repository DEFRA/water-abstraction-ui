'use strict';

// Using lodash functions over some native functions because
// they are forgiving to undefined.
const { size, find, includes, intersection, get, uniq, isBoolean } = require('lodash');
const { scope: scopes, externalRoles } = require('./constants');

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
const countRoles = (roles = [], type) => {
  // Handle array or string
  const types = typeof (type) === 'string' ? [type] : type;
  return roles.reduce((memo, role) => {
    return includes(types, role.role) ? memo + 1 : memo;
  }, 0);
};

/**
 * Checks if the user has a scope that is in the list of required scopes
 *
 * @param {array} requiredScopes A list of strings representing the scopes that are required for a resource
 * @param {array} userScopes The list of strings representing the scopes a user has
 * @returns {boolean}
 */
const hasMatch = (requiredScopes, userScopes) => {
  return size(intersection(requiredScopes, userScopes)) > 0;
};

/**
 * Does the role object have a role property of 'primary_user'?
 * { role: 'primary_user' }
 */
const isPrimaryUserRole = role => get(role, 'role') === externalRoles.licenceHolder;

/**
 * Is this a role with a role value of user_returns.
 * { role: 'user_returns' }
 */
const isUserReturnsRole = role => get(role, 'role') === externalRoles.colleagueWithReturns;

/**
 * Checks if there is a scope called 'external'
 *
 * @param scope An array of strings
 */
const isExternal = scope => includes(scope, scopes.external);

const isVmlAdmin = scope => hasMatch(scopes.allAdmin, scope);
const isPrimaryUser = roles => !!find(roles, isPrimaryUserRole);
const isUserReturnsUser = roles => !!find(roles, isUserReturnsRole);

const canReadLicence = entityId => !!entityId;
const canEditAbstractionReform = scope => hasMatch([
  scopes.abstractionReformUser,
  scopes.abstractionReformApprover
], scope);

const canApproveAbstractionReform = scope => includes(scope, scopes.abstractionReformApprover);

const canEditLicence = (scope, roles) => {
  return isExternal(scope) && size(roles) === 1 && isPrimaryUser(roles);
};

const canViewMutlipleLicences = (scope = [], roles = []) => {
  return isExternal(scope) && countRoles(roles, [externalRoles.colleague, externalRoles.licenceHolder]) > 1;
};

/**
 * Users who can edit returns:
 *
 * Licence Holders
 * Colleagues with returns access granted
 * Internal users with the returns scope
 */
const canSubmitReturns = (scope = [], roles = []) => {
  return isExternal(scope)
    ? isPrimaryUser(roles) || isUserReturnsUser(roles)
    : hasMatch(scope, [scopes.returns]);
};

const canEditReturns = (scope = [], roles = []) => {
  return hasMatch(scope, [scopes.returns]);
};

const canReadReturns = (scope = [], roles = []) => {
  return isVmlAdmin(scope) ||
    isPrimaryUser(roles) ||
    isUserReturnsUser(roles);
};

/**
 * Gets permissions available to current user based on current HAPI request
 * @param {Object} credentials - credentials from HAPI request
 * @return {Object} permissions - permissions object
 */
const getPermissions = (credentials = {}, entityRoles = []) => {
  const { entity_id: entityId, scope } = credentials;

  return {
    licences: {
      read: canReadLicence(entityId),
      edit: canEditLicence(scope, entityRoles),
      multi: canViewMutlipleLicences(scope, entityRoles)
    },
    admin: {
      defra: isVmlAdmin(scope)
    },
    returns: {
      read: canReadReturns(scope, entityRoles),
      submit: canSubmitReturns(scope, entityRoles),
      edit: canEditReturns(scope, entityRoles)
    },
    ar: {
      read: canEditAbstractionReform(scope),
      edit: canEditAbstractionReform(scope),
      approve: canApproveAbstractionReform(scope)
    }
  };
};

/**
 * Gets a list of permissions the user with the specified credentials has
 * on the supplied company ID
 * @param {Object} credentials
 * @param {String} companyEntityId GUID
 * @return {Object} of permissions
 */
const getCompanyPermissions = (credentials = {}, entityRoles = []) => {
  const companyEntityIds = uniq(entityRoles.map(role => role.company_entity_id).filter(entityId => !!entityId));

  return companyEntityIds.reduce((acc, companyEntityId) => {
    const roles = entityRoles.filter(row => row.company_entity_id === companyEntityId);
    acc[companyEntityId] = getPermissions(credentials, roles);
    return acc;
  }, {});
};

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
    throw new Error(`Attempt to check invalid permission ${permission}`);
  }
  return isGranted;
};

module.exports = {
  getPermissions,
  getCompanyPermissions,
  hasPermission
};
