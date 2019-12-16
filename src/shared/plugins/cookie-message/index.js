/**
 * HAPI Cookie Message plugin
 *
 * Checks whether the 'seen_cookie_message' cookie exists and has a value of 'yes',
 * Otherwise, creates/set the value to 'yes'
 *
 * @module lib/hapi-plugins/cookie-message
 */

const setCookie = (request, h) => {
  var cookieOptions = {
    ttl: 28 * 24 * 60 * 60 * 1000, // expires in 28 days
    isSecure: false,
    isHttpOnly: false
  };

  h.state('seen_cookie_message', 'yes', cookieOptions);

  return h.continue;
};

const _handler = async (request, h) => {
  const { seen_cookie_message: seenCookieMessage } = request.state;
  return (seenCookieMessage === 'yes') ? h.continue : setCookie(request, h);
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
