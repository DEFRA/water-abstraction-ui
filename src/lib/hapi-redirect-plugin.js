/**
 * HAPI redirect plugin
 *
 * @module lib/hapi-redirect-plugin
 */
const { URL } = require('url');

const redirectPlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreResponse',
      method: async (request, reply) => {
        // Detect redirect
        const { statusCode } = request.response;
        if ([301, 302].includes(statusCode)) {
          // Get utm codes
          const { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign } = request.query;

          if (utmSource) {
            // Build the URL being redirected to
            const { location } = request.response.headers;
            const redirectUrl = request.connection.info.protocol +
              '://' +
              request.info.host +
              location;

            // Parse the redirect URL and set UTM params
            const url = new URL(redirectUrl);
            url.searchParams.set('utm_source', utmSource);
            url.searchParams.set('utm_medium', utmMedium);
            url.searchParams.set('utm_campaign', utmCampaign);

            // Update redirect URL in response headers
            request.response.headers.location = url.href;
          }
        }

        // Continue processing request
        return reply.continue();
      }
    });

    return next();
  }
};

redirectPlugin.register.attributes = {
  name: 'redirectPlugin',
  version: '1.0.0'
};

module.exports = redirectPlugin;
