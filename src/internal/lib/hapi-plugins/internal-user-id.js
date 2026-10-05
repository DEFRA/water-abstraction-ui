'use strict'

const { AsyncLocalStorage } = require('node:async_hooks')
const { get, set } = require('lodash')
const { http } = require('@envage/water-abstraction-helpers')

// Holds the user id for the request currently being handled. Each request gets its own store, so concurrent requests
// each see their own user rather than sharing one
const storage = new AsyncLocalStorage()

const getUserFromRequest = request => get(request, 'defra.user')

/**
 * Adds the user id of the request being handled to the defra-internal-user-id header of an outgoing request
 *
 * @param {Object} options The outgoing request options
 */
const setInternalUserId = options => {
  const userId = storage.getStore()?.userId

  if (userId) {
    set(options, ['headers', 'defra-internal-user-id'], userId)
  }
}

/**
 * Plugin that adds the currently logged in user id
 * to the defra-internal-user-id header of an outgoing
 * request.
 *
 * A single listener is registered for the whole process. It reads the user from the store of whichever request is
 * making the outgoing call, so concurrent requests can't overwrite or remove each other's user
 */
const internalUserId = {
  register: server => {
    // Give each incoming request its own empty store before hapi starts handling it, so everything hapi then does for
    // that request (extensions, handler, outgoing calls) sees the same store
    server.listener.prependListener('request', () => {
      storage.enterWith({})
    })

    http.onPreRequest(setInternalUserId)

    server.ext({
      type: 'onPreHandler',
      method: async (request, h) => {
        const user = getUserFromRequest(request)
        const store = storage.getStore()

        if (user && store) {
          store.userId = user.user_id
        }

        return h.continue
      }
    })
  },

  pkg: {
    name: 'internalUserId',
    version: '1.0.0'
  }
}

module.exports = internalUserId
