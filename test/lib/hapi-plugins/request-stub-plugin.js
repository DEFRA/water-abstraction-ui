/**
 * Test helper plugin that allows the request object to be
 * modified.
 *
 * When used before the plugin under test, this can be used to
 * update the request object to simplify testing.
 *
 * For example the request could be made to look like the user is
 * authenticated.
 *
 * e.g.
 *
 * server.register({
 *   plugin: requestStub,
 *   options: {
 *     setupRequest: request => {
 *       request.auth = { isAuthenticated: true }
 *     }
 *   }
 * })
 */
const plugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPostAuth',
      method: async (request, h) => {
        if (options.setupRequest) {
          options.setupRequest(request);
        }
        return h.continue;
      }
    });
  },

  pkg: {
    name: 'requestStubPlugin',
    version: '2.0.0'
  }
};

module.exports = plugin;
