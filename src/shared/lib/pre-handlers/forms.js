'use strict';

const sessionForms = require('../session-forms');
const forms = require('../forms');

const isPost = method => method.toLowerCase() === 'post';

const createPreHandler = formContainer => (request, h) => {
  let form = formContainer.form(request);

  // Use session forms for post forms
  if (isPost(form.method)) {
    form = sessionForms.get(request, formContainer.form(request));
  }

  // Handle request
  if (request.method === form.method.toLowerCase()) {
    form = forms.handleRequest(
      formContainer.form(request),
      request,
      formContainer.schema(request)
    );

    // Redirect back to GET handler if validation issue for post forms
    if (!form.isValid && isPost(request.method)) {
      return h.postRedirectGet(form).takeover();
    }
  }

  return form;
};

exports.createPreHandler = createPreHandler;
