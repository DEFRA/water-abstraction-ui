/**
 * HAPI sessions plugin
 * allows the session manager to be attached to every request
 * @module lib/hapi-plugins/sessions
 */
const SessionStore = require('../session-store');
const Boom = require('boom');

const sessionRequired = (request) => {
  return request.auth.isAuthenticated && (request.auth.strategy === 'standard');
};

const onPreHandler = {
  type: 'onPreHandler',
  async method (request, h) {
    // Attach session store to HAPI request interface
    request.sessionStore = new SessionStore(request);

    if (!sessionRequired(request)) {
      return h.continue;
    }

    try {
      await request.sessionStore.load();
      return h.continue;
    } catch (err) {
      // Session not found - clear cookie
      if (err.name === 'NotFoundError') {
        request.cookieAuth.clear();
        return h.redirect('/welcome').takeover();
      }

      // Failed to load error
      throw Boom.unauthorized('Session not found');
    }
  }
};

const onPostHandler = {
  type: 'onPostHandler',
  async method (request, h) {
    await request.sessionStore.save();
    return h.continue;
  }
};

const sessionsPlugin = {
  register: (server, options) => {
    server.ext(onPreHandler);
    server.ext(onPostHandler);
  },

  pkg: {
    name: 'sessionsPlugin',
    version: '2.0.0'
  }
};

module.exports = sessionsPlugin;
