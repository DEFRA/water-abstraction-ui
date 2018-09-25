const Boom = require('boom');
const { difference } = require('lodash');
const { handleRequest, getValues, setValues } = require('../../lib/forms');
const licenceNumbersForm = require('./forms/licence-numbers');
const confirmLicenceNumbersForm = require('./forms/licence-numbers-confirm');
const { schema } = require('./forms/licence-numbers');

const { previewPaperForms, sendPaperForms } = require('../../lib/connectors/water-service/returns-notifications');
const { getUniqueLicenceNumbers } = require('./lib/helpers');

/**
 * Renders a page for the user to input a list of licences to whom
 * they wish to send return forms
 */
const getSendForms = async (request, h) => {
  return h.view('water/returns-notifications/forms', {
    ...request.view,
    form: licenceNumbersForm(request)
  });
};

/**
 * Previews the licences that notifications will be sent to as
 * part of the notification
 * @param {String} request.payload.licenceNumbers - list of licence numbers with common separators
 * @param {String} request.payload.csrf_token
 */
const postPreviewRecipients = async (request, h) => {
  const form = handleRequest(licenceNumbersForm(request), request, schema);

  if (form.isValid) {
    const { licenceNumbers } = getValues(form);
    const { username: emailAddress } = request.auth.credentials;

    // Preview sending of paper forms.  This checks whether due returns exist
    // for the requested licence numbers
    const result = await previewPaperForms(licenceNumbers, emailAddress);

    if (result.error) {
      throw Boom.badImplementation(`Error previewing returns paper forms`, result.error);
    }

    const foundLicenceNumbers = getUniqueLicenceNumbers(result.data);

    const confirmForm = setValues(confirmLicenceNumbersForm(request), { licenceNumbers: foundLicenceNumbers });

    return h.view('water/returns-notifications/forms-confirm', {
      ...request.view,
      form: confirmForm,
      licenceNumbers: foundLicenceNumbers,
      notMatched: difference(licenceNumbers, foundLicenceNumbers)
    });
  } else {
    return h.view('water/returns-notifications/forms', {
      ...request.view,
      form
    });
  }
};

/**
 * Queues the messages for sending
 * @param {String} request.payload.licenceNumbers - list of licence numbers with common separators
 * @param {String} request.payload.csrf_token
 */
const postSendForms = async (request, h) => {
  const form = handleRequest(confirmLicenceNumbersForm(request), request, schema);

  if (form.isValid) {
    const { licenceNumbers } = getValues(form);
    const { username: emailAddress } = request.auth.credentials;

    // Preview sending of paper forms.  This checks whether due returns exist
    // for the requested licence numbers
    const result = await sendPaperForms(licenceNumbers, emailAddress);

    if (result.error) {
      throw Boom.badImplementation(`Error previewing returns paper forms`, result.error);
    }

    return h.redirect('/admin/returns-notifications/forms-success');
  }

  return postPreviewRecipients(request, h);
};

/**
 * Success page for when flow completed
 */
const getSendFormsSuccess = (request, h) => {
  return h.view('water/returns-notifications/forms-success', {
    ...request.view
  });
};

module.exports = {
  getSendForms,
  postPreviewRecipients,
  postSendForms,
  getSendFormsSuccess
};
