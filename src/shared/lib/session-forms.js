const { get } = require('lodash');
const uuid = require('uuid/v4');
const queryString = require('querystring');

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

/**
 * Sets the form object in the session
 * @param {Object} request - hapi request
 * @param {Object} form - the form object to set in the session
 * @return {String} session key guid
 */
const setSessionForm = (request, form) => {
  const key = uuid();
  request.yar.set(key, form);
  return key;
};

const postRedirectGet = function (form, customPath) {
  const key = setSessionForm(this.request, form);
  const path = `${customPath || form.action}?${queryString.stringify({ form: key })}`;
  return this.redirect(path);
};

const postRedirectGetPlugin = {
  register: (server) => {
    server.decorate('toolkit', 'postRedirectGet', postRedirectGet);
  },

  pkg: {
    name: 'postRedirectGetPlugin',
    version: '1.0.0'
  }
};

exports.get = getSessionForm;
exports.set = setSessionForm;
exports.plugin = postRedirectGetPlugin;
