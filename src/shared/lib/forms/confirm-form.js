'use strict';

const { isString } = require('lodash');
const { formFactory, fields } = require('./index');

const getPath = (request, options = {}) => {
  if (isString(options)) {
    return options;
  }
  return options.action || request.path;
};

/**
 * Generic confirm form
 *
 * @param {Object} request The Hapi request object
 * @param {String} [buttonText] - the text for the submit button
 * @param {String|Object} [options] - if a string, this is the form action, otherwise a hash of options
 * @param {String} [options.action] - the form action
 * @param {Boolean} [options.isWarning] - render a red warning button
 * @return {Object} form object
 */
const form = (request, buttonText = 'Submit', options = {}) => {
  const { csrfToken } = request.view;
  const f = formFactory(getPath(request, options), 'POST');
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, {
    label: buttonText,
    controlClass: options.isWarning && 'govuk-button--warning'
  }));
  return f;
};

exports.form = form;
