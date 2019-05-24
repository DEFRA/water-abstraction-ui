/**
 * A module to dynamically calculate the user's scopes based on their
 * company and roles
 */
const { get } = require('lodash');
const { logger } = require('../../logger');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const idmConnector = require('../connectors/idm');
const crmConnector = require('../connectors/crm');

/**
 * Loads user data from IDM
 * @param {String} userId
 * @return {Promise} resolves with row of IDM user data
 */
const loadIDMUser = async (userId) => {
  const response = await idmConnector.findOne(userId);
  throwIfError(response.error);
  return response.data;
};

const loadCRMEntityRoles = entityId => {
  return crmConnector.entityRoles.setParams({ entityId }).findAll();
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

const getUniqueCompanyIds = (entityRoles = []) => {
  const allIds = entityRoles.map(er => er.company_entity_id);
  return Array.from(new Set(allIds));
};

const mapRolesToScopes = roles => roles.map(role => role.role);

const getCompanyPredicate = companyId => (role) => role.company_entity_id === companyId;

const assignExternalProperties = async (data, request) => {
  const { entity_id: entityId, companyId } = request.auth.credentials;

  data.entityRoles = await loadCRMEntityRoles(entityId);
  data.companyIds = getUniqueCompanyIds(data.entityRoles);
  data.companyCount = data.companyIds.length;

  if (companyId) {
    // Filter roles for selected company
    const roles = data.entityRoles.filter(getCompanyPredicate(companyId));
    // Use selected company roles to augment scopes
    data.userScopes = [...data.userScopes, ...mapRolesToScopes(roles)];
  }
};

const augmentAuthenticatedRequest = async (request, userId) => {
  try {
    const companyId = request.yar.get('companyId');

    const data = request.defra || {};

    data.user = await loadIDMUser(userId);
    data.userScopes = getUserScopes(data.user);
    data.companyId = companyId;

    if (isExternalUser(data.user)) {
      await assignExternalProperties(data, request);
    }

    request.defra = data;

    return {
      userId,
      companyId,
      scopes: data.userScopes
    };
  } catch (error) {
    logger.error('Failed to load entity scopes', error, get(request, 'auth.credentials'));
    throw error;
  }
};

/**
 * onCredentials plugin handler
 */
const handler = async (request, h) => {
  if (request.auth.isAuthenticated) {
    await augmentAuthenticatedRequest(request);
  }
  return h.continue;
};

const plugin = {
  register: (server) => {
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
module.exports._handler = handler;
module.exports.augmentAuthenticatedRequest = augmentAuthenticatedRequest;
