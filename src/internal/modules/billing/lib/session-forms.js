const { get } = require('lodash');

/**
 * Gets a form from the session, or uses the default one if none found
 * @param {Object} request - hapi request
 * @param {Object} defaultForm - the default form object to use
 * @return {Object} form
 */
const getSessionForm = (request, defaultForm) => {
  const sessionForm = request.yar.get(get(request, 'query.form'));
  if (sessionForm) {
    request.yar.clear(get(request, 'query.form'));
    return sessionForm;
  }
  return defaultForm;
};

exports.get = getSessionForm;
