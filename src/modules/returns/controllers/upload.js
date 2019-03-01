const { uploadForm } = require('../forms/upload');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const water = require('../../../lib/connectors/water.js');
const files = require('../../../lib/files');
const { get } = require('lodash');
const uploadHelpers = require('../lib/upload-helpers');
const returns = require('../../../lib/connectors/water-service/returns.js');

const errorMessages = {
  virus: 'The selected file contains a virus',
  notxml: 'The selected file must be an XML'
};

let redirectUrl;

/**
 * Upload xml return
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
const getXmlUpload = (request, h) => {
  const f = uploadForm(request);

  const error = request.query.error;

  const view = {
    ...request.view,
    pageTitle: 'Upload XML returns data',
    form: uploadHelpers.applyFormError(f, error, errorMessages)
  };

  return h.view('nunjucks/returns/upload.njk', view, { layout: false });
};

/**
 * Post handler for xml upload
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
async function postXmlUpload (request, h) {
  const file = uploadHelpers.getFile();

  try {
    await uploadHelpers.uploadFile(request.payload.file, file);

    // Get redirect Url to error page if checks fail
    redirectUrl = await uploadHelpers.runChecks(file);
  } catch (error) {
    // Log error
    throw error;
  }

  const userName = get(request, 'auth.credentials.username');

  // Send XML return data to API
  const postData = await returns.postXML(file, userName);
  const eventId = get(postData, 'data.eventId');

  // Delete temporary file
  await files.deleteFile(file);

  // if failed any checks, redirect
  if (redirectUrl) return h.redirect(redirectUrl);

  // Xml has passed checks, redirect to spinner page
  return h.redirect(`/returns/processing-upload/${eventId}`);
}

/**
 * Waiting page to be diplayed whilst XML return is being processed,
 * page refreshes every 5 seconds and checks the status of the event
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
const getSpinnerPage = async (request, h) => {
  const view = {
    ...request.view,
    pageTitle: 'Uploading returns data'
  };

  const eventId = request.params.event_id;

  // Get data from event database
  const { data, error } = await water.events.findOne(eventId);
  throwIfError(error);

  // ******************************* error needs updating
  const statusActions = {
    validated: `/returns/upload-summary/${eventId}`,
    error: `/returns/upload-errors/${eventId}`
  };

  // Once the status has been updated to 'validated', redirect to success page
  const { status } = data;
  if (status in statusActions) {
    return h.redirect(statusActions[status]);
  }

  return h.view('nunjucks/returns/processing-upload.njk', view, { layout: false });
};

exports.getXmlUpload = getXmlUpload;
exports.postXmlUpload = postXmlUpload;
exports.getSpinnerPage = getSpinnerPage;
