/**
* HAPI sessions plugin
* allows the session manager to be attached to every request
* @module lib/sessions/hapi-plugin
*/
const SessionStore = require('./session-store.js');
const Boom = require('boom');

const sessionsPlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      async method (request, reply) {
        // Attach session store to HAPI request interface
        request.sessionStore = new SessionStore(request);

        if (!request.auth.isAuthenticated) {
          return reply.continue();
        }

        try {
          await request.sessionStore.load();
          reply.continue();
        } catch (err) {
          // Failed to load error
          reply(Boom.unauthorized('Session not found'));
        }
      }
    });

    server.ext({
      type: 'onPostHandler',
      async method (request, reply) {
        await request.sessionStore.save();
        reply.continue();
      }
    });

    next();
  }
};

sessionsPlugin.register.attributes = {
  name: 'sessionsPlugin',
  version: '1.0.0'
};

module.exports = sessionsPlugin;
