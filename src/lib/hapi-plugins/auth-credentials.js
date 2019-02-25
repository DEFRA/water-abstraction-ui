/**
 * A module to dynamically calculate the user's scopes based on their
 * company and roles
 */
const { get, set } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const idmConnector = require('../connectors/idm');
const crmConnector = require('../connectors/crm');
const logger = require('../logger');

const loadCRMEntityRoles = entityId => {
  return crmConnector.entityRoles.setParams({ entityId }).findAll();
};

/**
 * Loads user data from IDM
 * @param {String} emailAddress
 * @return {Promise} resolves with row of IDM user data
 */
const loadIDMUser = async (email) => {
  const { data: [user], error } = await idmConnector.getUserByEmail(email);

  throwIfError(error);

  if (!user) {
    throw new Error(`IDM user with email address ${email} not found`);
  }

  return user;
};

/**
 * Gets scopes array from IDM user object
 * @param  {Object} user - from IDM users
 * @return {Array}       - array of scopes
 */
const getUserScopes = user => get(user, 'role.scopes', []);

/**
 * Checks whether IDM user is external
 * @param  {Object} user - from IDM users
 * @return {Boolean} - true if external user
 */
const isExternalUser = user => getUserScopes(user).includes('external');

/**
 * Checks whether to load scopes.  Scopes should not be loaded on unauthenticated
 * routes
 * @param  {Object} request - HAPI request
 * @return {Boolean}         - true if authenticated route
 */
const isAuthenticatedRoute = request => get(request, 'auth.isAuthenticated', false);

const mapRolesToScopes = roles => roles.map(role => role.role);

const getCompanyPredicate = companyId => (role) => role.company_entity_id === companyId;

/**
 * Loads all scopes for the current user based on their IDM and company roles
 * @param  {Object}  request - HAPI request
 * @return {Promise} resolves with scopes array
 */
const loadScopes = async (request) => {
  // Load scopes for current user and set in auth.credentials
  const { username, companyId, entity_id: entityId } = request.auth.credentials;

  const user = await loadIDMUser(username);

  // Get IDM scopes
  const scopes = getUserScopes(user);

  if (isExternalUser(user)) {
    // Load all user's roles into current request
    request.entityRoles = await loadCRMEntityRoles(entityId);

    if (companyId) {
      // Filter roles for selected company
      const roles = request.entityRoles.filter(getCompanyPredicate(companyId));

      // Use selected company roles to augment scopes
      scopes.push(...mapRolesToScopes(roles));
    }
  }

  return scopes;
};

/**
 * onCredentials plugin handler
 */
const handler = async (request, h) => {
  // We should only load scopes on authenticated routes
  if (isAuthenticatedRoute(request)) {
    try {
      const scopes = await loadScopes(request);
      set(request, 'auth.credentials.scope', scopes);
    } catch (error) {
      logger.error('Failed to load entity scopes', error, get(request, 'auth.credentials'));
      throw error;
    }
  }
  return h.continue;
};

const plugin = {
  register: (server, options) => {
    server.ext({
      type: 'onCredentials',
      method: handler
    });
  },
  pkg: {
    name: 'authCredentials',
    version: '2.0.0'
  }
};

module.exports = plugin;
module.exports.handler = handler;
