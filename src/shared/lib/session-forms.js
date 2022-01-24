'use strict';

const { get } = require('lodash');
const { v4: uuid } = require('uuid');
const queryString = require('querystring');
const cleanObject = require('../lib/clean-object');
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

/**
 * Gets the part of the url path before the query separator
 * @param {String} path
 * @return {String}
 */
const getPath = path => path.split('?')[0];

/**
 * Sets the current state of the form in the session
 * and redirects to view the page again in an error state
 * @param {Object} form
 * @param {String} [customPath] - custom path for redirection (default is form action)
 * @param {Object} [customParams] - custom query params (default is request.query)
 */
const postRedirectGet = function (form, customPath, customParams = null) {
  // The key that identifies this form submission in the session data
  const key = setSessionForm(this.request, form);

  const path = customPath || getPath(form.action);
  const params = {
    ...customParams || cleanObject(this.request.query),
    form: key
  };

  return this.redirect(`${path}?${queryString.stringify(params)}`);
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
exports._postRedirectGet = postRedirectGet;
