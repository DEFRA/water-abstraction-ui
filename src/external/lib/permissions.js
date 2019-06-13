'use strict';

const { get } = require('lodash');
const { scope } = require('./constants');

/**
 * Checks whether user has the supplied scope
 * Note - use constants defined in ../constants rather than string literals
 * @param  {Object}  request - current HAPI request
 * @param  {String}  scope   - scope to check
 * @return {Boolean}         [description]
 */
const hasScope = (request, scope) => {
  const scopes = get(request, 'auth.credentials.scope', []);
  return scopes.includes(scope);
};

const isAuthenticated = request => !!get(request, 'auth.credentials.userId');

// Internal / external
const isInternal = request => hasScope(request, scope.internal);
const isExternal = request => hasScope(request, scope.external);

// Primary user / assumed licence holder
const isPrimaryUser = request => hasScope(request, scope.licenceHolder);

// Returns
const isInternalReturns = request => hasScope(request, scope.returns);

const isExternalReturns = request => {
  const isReturnsAgent = hasScope(request, scope.colleagueWithReturns);
  return isPrimaryUser(request) || isReturnsAgent;
};

// Abstraction reform / digitise!
const isARUser = request => hasScope(request, scope.abstractionReformUser);
const isARApprover = request => hasScope(request, scope.abstractionReformApprover);
const isAnyAR = request => isARUser(request) || isARApprover(request);

exports.hasScope = hasScope;
exports.isAuthenticated = isAuthenticated;
exports.isInternal = isInternal;
exports.isExternal = isExternal;
exports.isPrimaryUser = isPrimaryUser;
exports.isInternalReturns = isInternalReturns;
exports.isExternalReturns = isExternalReturns;
exports.isARUser = isARUser;
exports.isARApprover = isARApprover;
exports.isAnyAR = isAnyAR;
