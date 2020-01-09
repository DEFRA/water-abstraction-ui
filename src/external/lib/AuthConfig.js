const { get, pick } = require('lodash');
const loginHelpers = require('./login-helpers');
const AuthConfigBase = require('shared/lib/AuthConfig');
const { logger } = require('external/logger');

const getUniqueCompanyIds = (entityRoles = []) => {
  const allIds = entityRoles.map(er => er.company_entity_id);
  return Array.from(new Set(allIds));
};

/**
 * Gets scopes array from IDM user object
 * @param  {Object} user - from IDM users
 * @return {Array}       - array of scopes
 */
const getCompanyPredicate = companyId => (role) => role.company_entity_id === companyId;

const mapRolesToScopes = roles => roles.map(role => role.role);

class AuthConfig extends AuthConfigBase {
  ifAuthenticated (request, h) {
    return loginHelpers.preRedirectIfAuthenticated(request, h);
  }

  async onSignIn (request, h, user) {
    const path = await loginHelpers.getLoginRedirectPath(request, user);
    return h.metaRedirect(path);
  };

  onSignOut (request, h) {
    const path = '/signed-out?u=e';
    return h.metaRedirect(path);
  }

  onUnauthorized (request, h) {
    logger.info(pick(request.response, ['error', 'message', 'statusCode', 'stack']));
    return h.redirect('/welcome');
  }

  async _mapUserRequestData (request, user) {
    const entityId = get(user, 'external_id');
    const companyId = request.yar.get('companyId');
    const companyName = request.yar.get('companyName');
    const entityRoles = await this.connectors.crm.entityRoles.getEntityRoles(entityId);
    const companyIds = getUniqueCompanyIds(entityRoles);
    const userScopes = get(user, 'role.scopes', []);

    if (companyId) {
      const roles = entityRoles.filter(getCompanyPredicate(companyId));
      userScopes.push(...mapRolesToScopes(roles));
    }

    return {
      userId: user.user_id,
      userName: user.user_name,
      user,
      entityId,
      companyId,
      companyName,
      entityRoles,
      companyIds,
      companyCount: companyIds.length,
      userScopes,
      lastLogin: get(user, 'last_login')
    };
  };
}

module.exports = AuthConfig;
