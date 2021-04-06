'use strict';

const { set } = require('lodash');

/**
 * HAPI Cookie Message plugin
 *
 * Checks whether the 'seen_cookie_message' cookie exists and has a value of 'yes'
 * Sets flag in request.view
 *
 * @module lib/hapi-plugins/cookie-message
 */

const _handler = async (request, h) => {
  // Set flag in request.view
  const isSeen = request.state.seen_cookie_message === 'yes';
  set(request, 'view.isCookieBannerVisible', !isSeen);
  return h.continue;
};

const cookieMessagePlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: _handler
    });
  },

  pkg: {
    name: 'cookieMessagePlugin',
    version: '1.0.0'
  }
};

module.exports = cookieMessagePlugin;
module.exports._handler = _handler;
