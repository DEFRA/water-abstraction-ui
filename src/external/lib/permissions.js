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

// Primary user / assumed licence holder
const isPrimaryUser = request => hasScope(request, scope.licenceHolder);

// Returns
const isReturnsUser = request => {
  const isReturnsAgent = hasScope(request, scope.colleagueWithReturns);
  return isPrimaryUser(request) || isReturnsAgent;
};

exports.hasScope = hasScope;
exports.isAuthenticated = isAuthenticated;
exports.isPrimaryUser = isPrimaryUser;
exports.isReturnsUser = isReturnsUser;
