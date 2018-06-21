/**
 * HAPI redirect plugin
 * If the user landed on a page with UTM tracking codes, but the controller
 * wishes to redirect (301/302 status code), we render an HTML page so GA
 * can track before redirecting.
 *
 * @module lib/hapi-redirect-plugin
 */

const secureHeadersPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPostHandler',
      method (request, reply) {
        if ('headers' in request.response) {
          request.response.headers['X-Frame-Options'] = 'DENY';
          request.response.headers['X-Content-Type-Options'] = 'nosniff';
          request.response.headers['X-XSS-Protection'] = '1';
          request.response.headers['Strict-Transport-Security'] = 'max-age=86400; includeSubDomains';
        }
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'secureHeadersPlugin',
    version: '1.0.0'
  }

};

module.exports = secureHeadersPlugin;
