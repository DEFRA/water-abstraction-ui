'use strict'

const forms = require('./forms')
const sessionForms = require('./session-forms')

const isEqualCaseInsensitive = (a, b) => a.toLowerCase() === b.toLowerCase()

const isPost = method => isEqualCaseInsensitive(method, 'post')
const isGet = method => isEqualCaseInsensitive(method, 'get')

/**
 * Handles form including session forms implementation for POST forms
 * @param {Object} request - hapi request
 * @param {Object} formContainer - { form, schema } each with signature request => ({})
 * @return {Object}
 */
const handleFormRequest = (request, formContainer) => {
  // The default form is based on whatever the underlying form container, for example
  // src/internal/modules/address-entry/forms/select-address.js generates plus what it extracts from the request object.
  const defaultForm = formContainer.form(request)

  let processedForm

  // Some forms, like the select-address form, are designated as 'post' forms. The user is expected to submit a value
  // and the form will be POSTed to the UI. What this is checking for is we have a GET request for a 'post' form based
  // page. If we do, there are 2 possible scenarios
  //
  // - this is the first GET request to the page so sessionForms() will pull nothing out of the session and default to
  //   defaultForm. This will then be used to build the page
  // - this is a result of a POST request being rejected because of a validation error. This means the form will have
  //   been saved in the session and sessionForms() will retrieve it along with the error details. defaultForm will be
  //   ignored
  if (isPost(defaultForm.method) && isGet(request.method)) {
    processedForm = sessionForms.get(request, defaultForm)
  }

  // If we didn't fall into the previous block we next check if the type of form matches the request type. This is
  // where a form submission will be validated, for example when the select-address form (a 'post' designated form) is
  // POSTed to the UI the submission will be checked. forms.handleRequest() is where all the Joi validation and
  // custom error message determination happens
  if (isEqualCaseInsensitive(request.method, defaultForm.method)) {
    processedForm = forms.handleRequest(defaultForm, request, formContainer.schema(request))
  }

  return processedForm
}

exports.handleFormRequest = handleFormRequest
