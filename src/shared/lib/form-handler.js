'use strict';

const forms = require('./forms');
const sessionForms = require('./session-forms');

const isEqualCaseInsensitive = (a, b) => a.toLowerCase() === b.toLowerCase();

const isPost = method => isEqualCaseInsensitive(method, 'post');
const isGet = method => isEqualCaseInsensitive(method, 'get');

/**
 * Handles form including session forms implementation for POST forms
 * @param {Object} request - hapi request
 * @param {Object} formContainer - { form, schema } each with signature request => ({})
 * @return {Object}
 */
const handleFormRequest = (request, formContainer) => {
  let form = formContainer.form(request);

  // Use session forms for post forms
  if (isPost(form.method) && isGet(request.method)) {
    form = sessionForms.get(request, formContainer.form(request));
  }

  // Handle request
  if (isEqualCaseInsensitive(request.method, form.method)) {
    form = forms.handleRequest(
      formContainer.form(request),
      request,
      formContainer.schema(request)
    );
  }

  return form;
};

exports.handleFormRequest = handleFormRequest;
