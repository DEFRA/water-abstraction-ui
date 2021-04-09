'use strict';

const { set } = require('lodash');
const routes = require('./routes');
const constants = require('./lib/constants');

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

/**
 * Pre handler sets cookie banner state in view
 */
const _handler = async (request, h) => {
  const isAnalyticsCookiesEnabled = request.isAnalyticsCookiesEnabled();

  set(request, 'view.cookieBanner', {
    isAnalyticsCookiesEnabled,
    isVisible: (isAnalyticsCookiesEnabled === null) && !isCookiesPage(request)
  });

  return h.continue;
};

function isAnalyticsCookiesEnabled () {
  const value = this.state[constants.cookieName];
  if (value === constants.accepted) {
    return true;
  }
  return value === constants.declined ? false : null;
};

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
