const crypto = require('crypto');

const RE_GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Hashes the input using sha256 then returns the first 20 characters.
 */
const hashValue = (input = '') => {
  return crypto.createHash('sha256').update(input).digest('hex').substr(0, 20);
};

const hashWordIfContainsNumber = word => /\d/.test(word) ? hashValue(word) : word;

/**
 * For the given page title, if there are any words containing a number,
 * the word is hashed.
 */
const anonymisePageTitle = (pageTitle = '') => {
  const words = pageTitle.split(' ');
  return words.map(hashWordIfContainsNumber).join(' ');
};

const replaceGuids = path => path.replace(RE_GUID, '_id_');

/**
 * Hashes any words containing numbers in the view.pageTitle property
 *
 * Removes the query string
 *
 * Replaces uuids in the path with _id_ placeholder.
 */
const plugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        if (!request.path.startsWith('/public')) {
          const view = request.view || {};
          view.gaUrl = replaceGuids(request.url.pathname);
          view.gaPageTitle = anonymisePageTitle(view.pageTitle);
          request.view = view;
        }
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'anonGoogleAnalytics',
    version: '2.0.0'
  }
};

module.exports = plugin;
