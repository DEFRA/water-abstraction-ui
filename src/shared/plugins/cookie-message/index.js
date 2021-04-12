'use strict';

const { set, isEmpty } = require('lodash');
const routes = require('./routes');
const constants = require('./lib/constants');
const qs = require('querystring');
const { getSetCookiePreferences, getCookies } = require('./controller');

/**
 * HAPI Cookie Message plugin
 *
 * Checks whether the 'seen_cookie_message' cookie exists and has a value of 'yes'
 * Sets flag in request.view
 *
 * @module lib/hapi-plugins/cookie-message
 */

const cookieOptions = {
  isHttpOnly: false,
  ttl: 28 * 24 * 60 * 60 * 1000,
  isSameSite: 'Lax'
};

const isCookiesPage = request => request.path === '/cookies';

const getCurrentPath = request => isEmpty(request.query)
  ? request.path
  : request.path + '?' + qs.stringify(request.query);

const getPreferencesPath = (request, isAccepted) => {
  const redirectPath = getCurrentPath(request);
  const query = qs.stringify({
    redirectPath,
    acceptAnalytics: isAccepted
  });
  return `/set-cookie-preferences?${query}`;
};

const getCookiesPagePath = request => `/cookies?${qs.stringify({ redirectPath: getCurrentPath(request) })}`;

/**
 * Pre handler sets cookie banner state in view
 */
const _handler = async (request, h) => {
  const isEnabled = request.isAnalyticsCookiesEnabled();

  // Get flash messages
  const [flashMessage] = request.yar.flash(constants.flashMessageType);

  set(request, 'view.cookieBanner', {
    isAnalyticsCookiesEnabled: isEnabled,
    isVisible: (isEnabled === null) && !isCookiesPage(request),
    acceptPath: getPreferencesPath(request, 1),
    rejectPath: getPreferencesPath(request, 0),
    flashMessage,
    cookiesPagePath: getCookiesPagePath(request)
  });

  return h.continue;
};

function isAnalyticsCookiesEnabled () {
  const value = this.state[constants.cookieName];
  if (value === constants.accepted) {
    return true;
  }
  return value === constants.rejected ? false : null;
}

function setCookiePreferences (isAnalyticsAccepted) {
  // Set preferences
  this.state(constants.cookieName, isAnalyticsAccepted ? constants.accepted : constants.rejected);

  // Clear analytics cookies
  if (!isAnalyticsAccepted) {
    ['_ga', '_gid', '_gat', '_gat_govuk_shared'].forEach(cookieName => {
      this.unstate(cookieName);
    });
  }
}

const cookieMessagePlugin = {
  register: (server, options) => {
    // Register cookie
    server.state(constants.cookieName, cookieOptions);

    // Register pre handler
    server.ext({
      type: 'onPreHandler',
      method: _handler
    });

    // Decorate request
    server.decorate('request', 'isAnalyticsCookiesEnabled', isAnalyticsCookiesEnabled);
    server.decorate('toolkit', 'setCookiePreferences', setCookiePreferences);

    // Register routes
    server.route(Object.values(routes));
  },

  pkg: {
    name: 'cookieMessagePlugin',
    version: '1.0.0'
  }
};

module.exports = cookieMessagePlugin;
module.exports._handler = _handler;
