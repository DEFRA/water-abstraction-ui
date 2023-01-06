'use strict'

/**
 * Used by HapiPinoPlugin to determine which requests to log
 * @module HapiPinoIgnoreRequestService
 */

/**
 * Returns true or false whether a request should be logged
 *
 * Used by `src/shared/plugins/hapi-pino.plugin.js` to control what does and doesn't get added to our log output.
 * `/status` is to support the AWS load balancer health checks which fire approximately every 500ms. If we logged these
 * requests our log would be too noisy to prove useful. (`/` and `/status` go to the same place hence both are
 * listed).
 *
 * When a view is requested, a number of assets will be requested along with it. So, a single request for a page will
 * result in multiple log entries. Because we log both the request and response details, when viewed locally each
 * entry is 41 lines long!
 *
 * So, we also do not log any requests to `/assets/*` or `/public/*.
 *
 * @param {Object} options The options passed to the HapiPino plugin. See src/shared/plugins/hapi-pino.plugin.js
 * @param {request} request Hapi request object created internally for each incoming request
 *
 * @returns {boolean} true if the request should be ignored, else false
 */
function go (options, request) {
  const staticPaths = ['/', '/status', '/csp/report', '/robots.txt']

  // If request is a known path ignore it
  if (staticPaths.includes(request.path)) {
    return true
  }

  // If logging asset requests is disabled and the request is for an asset ignore it
  if (!options.logAssetRequests) {
    // Asset requests seem to go to either /public/* or /assets/* so we check for both
    const assetPaths = ['/public', '/assets']

    const match = assetPaths.some((startOfPath) => {
      return request.path.startsWith(startOfPath)
    })

    return match
  }

  // Do not ignore all other requests
  return false
}

module.exports = {
  go
}
