/**
 * HAPI CSRF plugin
 * For post handlers on authenticated routes, checks the CSRF token is present
 * and matches that in the user's session
 * Also checks the referer header to ensure request came from same site
 *
 * @module lib/hapi-plugins/csrf
 */
const { URL } = require('url');
const Boom = require('boom');

const csrfPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        // Ignore GET requests
        if (request.method === 'get') {
          return reply.continue;
        }

        // Ignore unauthenticated routes
        if (!request.auth.isAuthenticated) {
          return reply.continue;
        }

        // Check referrer if header is set
        if (request.headers.referer) {
          const currentHost = new URL(`${request.info.protocol}://${request.info.host}`);
          const refererUrl = new URL(request.headers.referer);

          if (currentHost.hostname !== refererUrl.hostname) {
            return reply(Boom.badRequest('CSRF protection: invalid HTTP referer header', { isCsrfError: true }));
          }
        }

        // Check CSRF token
        const token = request.sessionStore.get('csrf_token');
        if (token !== request.payload.csrf_token) {
          return reply(Boom.badRequest('CSRF protection: missing/invalid CSRF token', { isCsrfError: true }));
        }

        // Continue processing request
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'csrfPlugin',
    version: '2.0.0'
  }
};

module.exports = csrfPlugin;
