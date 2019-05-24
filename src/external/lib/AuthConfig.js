const { get, set } = require('lodash');
const uuid = require('uuid/v4');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const loginHelpers = require('./login-helpers');
const permissions = require('./permissions');

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

class AuthConfig {
  constructor (config, connectors) {
    this.connectors = connectors;
    this.config = config;
  }

  ifAuthenticated (request, h) {
    return loginHelpers.preRedirectIfAuthenticated(request, h);
  }

  authenticate (email, password) {
    return this.connectors.idm.users.authenticate(email, password, this.config.idm.application);
  }

  async signIn (request, user) {
    const { user_id: userId } = user;

    // Set user ID in auth cookie
    request.cookieAuth.set({ userId });

    // Set session
    request.yar.set('csrfToken', uuid());
    request.yar.set('userId', userId);
    request.yar.set('ip', request.info.remoteAddress);

    // Create entity
    // This is currently required by both internal and external as the returns
    // model requires an entity ID
    if (!user.external_id) {
      const entity = await this.connectors.crm.entities.getOrCreateIndividual(user.user_name);
      await this.connectors.idm.users.updateExternalId(user, entity.entity_id);
    }
  }

  async onSignIn (request, h, user) {
    const path = await loginHelpers.getLoginRedirectPath(request, user);
    return h.metaRedirect(path);
  };

  signOut (request, h) {
    request.cookieAuth.clear();
    request.yar.reset();
  }

  onSignOut (request, h) {
    const path = `/signed-out?u=${permissions.isInternal(request) ? 'i' : 'e'}`;
    return h.metaRedirect(path);
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
      userScopes
    };
  };

  async validateFunc (request, data) {
    const { userId } = data;

    let credentials = {};
    let valid = false;

    const isValid = !!userId && (request.yar.get('userId') === userId);

    if (isValid) {
      const { error, data: user } = await this.connectors.idm.users.findOne(userId);
      throwIfError(error);

      // Get user data and augment request
      const data = await this._mapUserRequestData(request, user);
      set(request, 'defra', data);

      if (user) {
        valid = true;
        credentials = {
          userId,
          scope: data.userScopes
        };
      }
    }

    return { valid, credentials };
  };
}

module.exports = AuthConfig;
