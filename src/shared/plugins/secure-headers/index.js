const path = require('path');

/**
 * Creates a feature policy header value using the features that are currently
 * supported. This will need to be added to as new features become supported.
 */
const getFeaturePolicy = () => {
  const rules = [
    'geolocation \'self\';',
    'autoplay \'none\';',
    'picture-in-picture \'none\';'
  ];

  return rules.join(' ');
};

const isStaticAsset = request =>
  ['.js', '.css', '.ico', '.png', '.woff', '.woff2'].includes(path.extname(request.path));

const postHandler = (request, reply) => {
  if ('headers' in request.response) {
    request.response.headers['X-Frame-Options'] = 'DENY';
    request.response.headers['X-Content-Type-Options'] = 'nosniff';
    request.response.headers['X-XSS-Protection'] = '1';
    request.response.headers['Strict-Transport-Security'] = 'max-age=86400; includeSubDomains';
    request.response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    request.response.headers['Feature-Policy'] = getFeaturePolicy();

    // Please note the CSP headers are handled and configured using the
    // Blankie plugin which is added in the index.js entry fie.
    if (isStaticAsset(request)) {
      request.response.headers['cache-control'] = 'public, max-age=3600';
      request.response.headers['Expires'] = 3600;
    } else {
      request.response.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
      request.response.headers['Expires'] = 0;
      request.response.headers['Pragma'] = 'no-cache';
    }
  }
  return reply.continue;
};

const secureHeadersPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPostHandler',
      method: postHandler
    });
  },

  pkg: {
    name: 'secureHeadersPlugin',
    version: '1.0.0'
  }
};

module.exports = secureHeadersPlugin;
