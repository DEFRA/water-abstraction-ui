const { get, set } = require('lodash')
const { v4: uuid } = require('uuid')
const { throwIfError } = require('@envage/hapi-pg-rest-api')

/**
 * Configures the new session for a newly authenticated user.
 * @param {Object} request The HAPI request
 * @param {String} userId The user id
 */
const setSession = (request, userId) => {
  // Destroy any previous session to prevent an user returning to
  // a session from a previous visit.
  request.yar.reset()
  request.yar.set('csrfToken', uuid())
  request.yar.set('userId', userId)
  request.yar.set('ip', get(request, 'info.remoteAddress'))
}

class AuthConfig {
  constructor (config, connectors) {
    this.connectors = connectors
    this.config = config
  }

  ifAuthenticated (request, h) {
  }

  authenticate (email, password) {
    return this.connectors.idm.users.authenticate(email, password, this.config.idm.application)
  }

  async signIn (request, user) {
    const { user_id: userId } = user

    // Set user ID in auth cookie
    request.cookieAuth.set({ userId })

    setSession(request, userId)

    // Create entity
    // This is currently required by both internal and external as the returns
    // model requires an entity ID
    if (!user.external_id) {
      const entity = await this.connectors.crm.entities.getOrCreateIndividual(user.user_name)
      await this.connectors.idm.users.updateExternalId(user, entity.entity_id)
    }
  }

  async onSignIn (request, h, user) {
  };

  signOut (request) {
    request.cookieAuth.clear()
    request.yar.reset()
  }

  onSignOut (request, h) {
  }

  onUnauthorized (request, h) {
  }

  async _mapUserRequestData (request, user) {
    const entityId = get(user, 'external_id')
    const userScopes = get(user, 'roles', [])

    return {
      userId: user.user_id,
      userName: user.user_name,
      user,
      entityId,
      userScopes,
      lastLogin: get(user, 'last_login')
    }
  };

  async validateFunc (request, data) {
    const { userId } = data

    let credentials = {}
    let valid = false

    const isValid = !!userId && (request.yar.get('userId') === userId)

    if (isValid) {
      const { error, data: user } = await this.connectors.idm.users.findOne(userId)
      throwIfError(error)

      if (!user.enabled) {
        return { valid: false, credentials: {} }
      }

      // Get user data and augment request
      const data = await this._mapUserRequestData(request, user)

      set(request, 'defra', data)

      if (user) {
        valid = true
        credentials = {
          userId,
          scope: data.userScopes
        }
      }
    }

    return { valid, credentials }
  };
}

module.exports = AuthConfig
