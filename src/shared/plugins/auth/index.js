'use strict';

const routes = require('./routes');

module.exports = {
  name: 'authPlugin',
  version: '1.0.0',
  register: async function (server, options) {
    // Import routes
    server.route(routes);

    // Attach methods to request
    server.ext({
      type: 'onPreHandler',
      method: async (request, h) => {
        request.logIn = async (user) => {
          await options.signIn(request, user);
          return options.onSignIn(request, h, user);
        };

        request.logOut = async () => {
          options.signOut(request, h);
          return options.onSignOut(request, h);
        };

        // Continue processing request
        return h.continue;
      }
    });
  }
};
