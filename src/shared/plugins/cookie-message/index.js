'use strict'

const { set, isEmpty } = require('lodash')
const routes = require('./routes')
const constants = require('./lib/constants')
const qs = require('querystring')
const { getAnalyticsCookieDomain } = require('./lib/cookie-domain')

/**
 * HAPI Cookie Message plugin
 * Provides a means of users opting in/out of analytics cookies
 *
 * @module lib/hapi-plugins/cookie-message
 */

/**
 * Predicate to check whether user is currently on the cookies page
 *
 * @param {Object} request
 * @returns {Boolean}
 */
const isCookiesPage = request => request.path === '/cookies'

/**
 * Gets the current page path, including query string
 *
 * @param {Object} request
 * @returns {String}
 */
const getCurrentPath = request => isEmpty(request.query)
  ? request.path
  : `${request.path}?${qs.stringify(request.query)}`

/**
 * Gets the path to set the cookie preferences
 *
 * @param {Object} request
 * @param {Boolean} isAccepted - whether the user opts in/out of analytics cookies
 * @returns {String}
 */
const getPreferencesPath = (request, isAccepted) => {
  const redirectPath = getCurrentPath(request)
  const query = qs.stringify({
    redirectPath,
    acceptAnalytics: isAccepted ? 'true' : 'false'
  })
  return `/set-cookie-preferences?${query}`
}

/**
 * Gets the path to the cookies page, including a redirectPath query param which points
 * back to the user's current path
 *
 * @param {Object} request
 * @returns {String}
 */
const getCookiesPagePath = request => `/cookies?${qs.stringify({ redirectPath: getCurrentPath(request) })}`

/**
 * Pre handler sets cookie banner state in view
 *
 * @param {Object} request
 * @param {Object} h
 */
const _handler = async (request, h) => {
  const isEnabled = request.isAnalyticsCookiesEnabled()

  // Get flash messages
  const [flashMessage] = request.yar.flash(constants.flashMessageType)

  set(request, 'view.cookieBanner', {
    flashMessage,
    isAnalyticsCookiesEnabled: isEnabled,
    isVisible: (isEnabled === null) && !isCookiesPage(request),
    acceptPath: getPreferencesPath(request, 1),
    rejectPath: getPreferencesPath(request, 0),
    cookiesPagePath: getCookiesPagePath(request)
  })

  return h.continue
}

/**
 * Checks whether analytics cookies are enabled by inspecting the state
 * of the cookie.  If null is returned, the user has not yet
 * set their preferences.
 *
 * @return {Boolean|Null}
 */
function isAnalyticsCookiesEnabled () {
  const value = this.state[constants.cookieName]
  if (value === constants.accepted) {
    return true
  }
  return value === constants.rejected ? false : null
}

/**
 * Sets the users analytics cookie preferences by setting the state
 * of the cookie.
 *
 * If the user has opted out, we unset any Google Analytics cookies
 * that are currently set.
 *
 * @param {Boolean} isAnalyticsAccepted
 */
function setCookiePreferences (isAnalyticsAccepted) {
  // Set preferences
  this.state(constants.cookieName, isAnalyticsAccepted ? constants.accepted : constants.rejected)

  // Clear analytics cookies
  if (!isAnalyticsAccepted) {
    ['_ga', '_gid', '_gat', '_gat_govuk_shared'].forEach(cookieName => {
      this.unstate(cookieName, {
        domain: getAnalyticsCookieDomain(this.request.info.hostname)
      })
    })
  }
}

/**
 * Gets the options for declaring the cookie that will manage the
 * preferences
 *
 * @returns {Object}
 */
const getCookieOptions = () => ({
  isSecure: process.env.ENVIRONMENT !== 'local',
  isHttpOnly: true,
  ttl: 365 * 24 * 60 * 60 * 1000,
  isSameSite: 'Lax'
})

const cookieMessagePlugin = {
  register: server => {
    // Register cookie
    server.state(constants.cookieName, getCookieOptions())

    // Register pre handler
    server.ext({
      type: 'onPreHandler',
      method: _handler
    })

    // Decorate request
    server.decorate('request', 'isAnalyticsCookiesEnabled', isAnalyticsCookiesEnabled)
    server.decorate('toolkit', 'setCookiePreferences', setCookiePreferences)

    // Register routes
    server.route(Object.values(routes))
  },

  pkg: {
    name: 'cookieMessagePlugin',
    version: '2.0.0',
    dependencies: {
      yar: '9.x.x'
    }
  }
}

module.exports = cookieMessagePlugin
module.exports._handler = _handler
module.exports._isAnalyticsCookiesEnabled = isAnalyticsCookiesEnabled
module.exports._setCookiePreferences = setCookiePreferences
