/**
 * HAPI sessions plugin
 * allows the session manager to be attached to every request
 * @module lib/hapi-plugins/sessions
 */
const SessionStore = require('../session-store.js');
const Boom = require('boom');

const sessionsPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      async method (request, reply) {
        // Attach session store to HAPI request interface
        request.sessionStore = new SessionStore(request);

        if (!request.auth.isAuthenticated) {
          return reply.continue;
        }

        try {
          await request.sessionStore.load();
          return reply.continue;
        } catch (err) {
          // Failed to load error
          return reply(Boom.unauthorized('Session not found'));
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
