'use strict';

const { get, isArray, intersection } = require('lodash');
const { scope } = require('./constants');

const makeArray = value => isArray(value) ? value : [value];

/**
 * Checks whether user has the supplied scope
 * Note - use constants defined in ../constants rather than string literals
 * @param  {Object}  request - current HAPI request
 * @param  {String|Array} scope - scope or scopes to check
 * @return {Boolean}         [description]
 */
const hasScope = (request, scope) => {
  const userScopes = makeArray(get(request, 'auth.credentials.scope', []));
  const testScopes = makeArray(scope);
  return intersection(userScopes, testScopes).length > 0;
};

const isAuthenticated = request => !!get(request, 'auth.credentials.userId');

// Returns
const isInternalReturns = request => hasScope(request, scope.returns);
const isBulkReturnNotifications = request => hasScope(request, scope.bulkReturnNotifications);

// Abstraction reform / digitise!
const isARUser = request => hasScope(request, scope.abstractionReformUser);
const isARApprover = request => hasScope(request, scope.abstractionReformApprover);
const isAnyAR = request => isARUser(request) || isARApprover(request);

const isHofOrRenewalNotifications = request => {
  return [scope.hofNotifications, scope.renewalNotifications]
    .some(scope => hasScope(request, scope));
};

const isAnyNotifications = request => {
  return scope.allNotifications.some(scope => hasScope(request, scope));
};

const isBasicUser = request => {
  const scopes = get(request, 'auth.credentials.scope', []);
  return scopes.length === 0;
};

const isManageTab = request => hasScope(request, scope.hasManageTab);

exports.hasScope = hasScope;
exports.isAuthenticated = isAuthenticated;
exports.isInternalReturns = isInternalReturns;
exports.isBulkReturnNotifications = isBulkReturnNotifications;
exports.isARUser = isARUser;
exports.isARApprover = isARApprover;
exports.isAnyAR = isAnyAR;
exports.isHofOrRenewalNotifications = isHofOrRenewalNotifications;
exports.isAnyNotifications = isAnyNotifications;
exports.isBasicUser = isBasicUser;
exports.isManageTab = isManageTab;
