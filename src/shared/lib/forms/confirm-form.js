'use strict';

const { formFactory, fields } = require('./index');

/**
 * Generic confirm form
 *
 * @param {Object} request The Hapi request object
 * @param {String} [buttonText] - the text for the submit button
 * @param {String} [action] - the path to post to
 * @return {Object} form object
 */
const form = (request, buttonText = 'Submit', action) => {
  const { csrfToken } = request.view;
  const f = formFactory(action || request.path, 'POST');
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: buttonText }));
  return f;
};

exports.form = form;
