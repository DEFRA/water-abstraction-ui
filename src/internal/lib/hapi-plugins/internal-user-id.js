'use strict';

const { get, set } = require('lodash');
const { http } = require('@envage/water-abstraction-helpers');

const getUserFromRequest = request => get(request, 'defra.user');

/**
 * Plugin that adds the currently logged in user id
 * to the defra-internal-user-id header of an outgoing
 * request.
 */
const internalUserId = {
  register: server => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, h) => {
        const user = getUserFromRequest(request);

        if (user) {
          http.onPreRequest(options => {
            set(options, ['headers', 'defra-internal-user-id'], user.user_id);
          });
        }
        return h.continue;
      }
    });

    server.ext({
      type: 'onPostHandler',
      method: async (request, h) => {
        const user = getUserFromRequest(request);

        if (user) {
          http.removePreRequestListener();
        }
        return h.continue;
      }
    });
  },

  pkg: {
    name: 'internalUserId',
    version: '1.0.0'
  }
};

module.exports = internalUserId;
