/**
* HAPI sessions plugin
* allows the session manager to be attached to every request
* @module lib/sessions/hapi-plugin
*/
const SessionStore = require('./session-store.js');

const sessionsPlugin = {
  register(server, options, next) {
    server.ext({
      type: 'onPreHandler',
      async method(request, reply) {
        // Attach session store to request
        request.sessionStore = new SessionStore(request);
        reply.continue();
      },
    });

    next();
  },
};

sessionsPlugin.register.attributes = {
  name: 'sessionsPlugin',
  version: '1.0.0',
};

module.exports = sessionsPlugin;
