/**
 * HAPI redirect plugin
 * If the user landed on a page with UTM tracking codes, but the controller
 * wishes to redirect (301/302 status code), we render an HTML page so GA
 * can track before redirecting.
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

          if (utmSource || utmMedium || utmCampaign) {
            // Build the URL being redirected to
            const { location: redirectUrl } = request.response.headers;

            const { view } = request;

            // Render HTML page with tracking code and JS / meta tag redirect
            return reply.view('water/redirect', {
              ...view,
              redirectUrl
            }, { layout: 'blank' });
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
