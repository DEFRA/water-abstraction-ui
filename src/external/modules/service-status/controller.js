const { get } = require('lodash');

const { getStatus } = require('./lib/index');
const { mapToJSON, mapToView } = require('./lib/mappers');

/**
 * Gets information on current status of the service
 * @param {String} [query.format] - optional, set to 'json' for JSON data
 */
async function serviceStatus (request, h) {
  const status = await getStatus();

  // Return as JSON
  if (get(request, 'query.format') === 'json') {
    return mapToJSON(status);
  }

  const view = mapToView(status);

  // Return as HTML
  return h.view('nunjucks/service-status/index.njk', view, { layout: false });
};

module.exports = {
  serviceStatus
};
