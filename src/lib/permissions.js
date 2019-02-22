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

const isAuthenticated = request => !!get(request, 'state.sid');

// Internal / external
const isInternal = request => hasScope(request, scope.internal);
const isExternal = request => hasScope(request, scope.external);

// Primary user / assumed licence holder
const isPrimaryUser = request => hasScope(request, scope.licenceHolder);

// Returns
const isInternalReturns = request => hasScope(request, scope.returns);

const isExternalReturns = request => {
  const isPrimary = hasScope(request, scope.licenceHolder);
  const isReturnsAgent = hasScope(request, scope.colleagueWithReturns);
  return isPrimary || isReturnsAgent;
};

// Abstraction reform / digitise!
const isARUser = request => hasScope(request, scope.abstractionReformUser);
const isARApprover = request => hasScope(request, scope.abstractionReformApprover);
const isAnyAR = request => isARUser(request) || isARApprover(request);

module.exports = {
  hasScope,
  isAuthenticated,
  isInternal,
  isExternal,
  isPrimaryUser,
  isInternalReturns,
  isExternalReturns,
  isARUser,
  isARApprover,
  isAnyAR
};
