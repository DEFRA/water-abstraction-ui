/**
 * HAPI sessions plugin
 * allows the session manager to be attached to every request
 * @module lib/hapi-plugins/sessions
 */
const SessionStore = require('../session-store.js');
const Boom = require('boom');

const sessionRequired = (request) => {
  return request.auth.isAuthenticated && (request.auth.strategy === 'standard');
};

const sessionsPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      async method (request, reply) {
        // Attach session store to HAPI request interface
        request.sessionStore = new SessionStore(request);

        if (!sessionRequired(request)) {
          return reply.continue;
        }

        try {
          await request.sessionStore.load();
          return reply.continue;
        } catch (err) {
          // Session not found - clear cookie
          if (err.name === 'NotFoundError') {
            request.cookieAuth.clear();
            return reply.redirect('/welcome').takeover();
          }

          // Failed to load error
          throw Boom.unauthorized('Session not found');
        }
      }
    });

    server.ext({
      type: 'onPostHandler',
      async method (request, reply) {
        await request.sessionStore.save();
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'sessionsPlugin',
    version: '2.0.0'
  }
};

module.exports = sessionsPlugin;
