const { uploadForm } = require('../forms/upload');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const water = require('../../../lib/connectors/water.js');
const files = require('../../../lib/files');
const { get } = require('lodash');
const uploadHelpers = require('../lib/upload-helpers');
const returns = require('../../../lib/connectors/water-service/returns.js');
const logger = require('../../../lib/logger');

const errorMessages = {
  invalidxml: 'The selected file must use the template',
  notxml: 'The selected file must be an XML',
  uploaderror: 'The selected file could not be uploaded – try again',
  virus: 'The selected file contains a virus'
};

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
  let redirectUrl;
  let eventId;
  const file = uploadHelpers.getFile();

  try {
    await uploadHelpers.uploadFile(request.payload.file, file);

    // Get redirect Url to error page if checks fail
    redirectUrl = await uploadHelpers.runChecks(file);

    const userName = get(request, 'auth.credentials.username');
    const fileData = await files.readFile(file);

    // Send XML return data to API
    const postData = await returns.postXML(fileData.toString(), userName);
    eventId = get(postData, 'data.eventId');
  } catch (error) {
    // Log error
    logger.error('Error with XML upload checks', error);
  } finally {
    // Delete temporary file
    await files.deleteFile(file);
  }

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
  const userName = get(request, 'auth.credentials.username');
  const filter = { event_id: eventId, issuer: userName };

  // Get data from event database
  const { data, error } = await water.events.findMany(filter);
  throwIfError(error);

  if (!data[0]) logger.error('No event found with selected event_id and issuer');

  const statusActions = {
    validated: `/returns/upload-summary/${eventId}`,
    undefined: '/returns/upload?error=uploaderror'
  };

  const errorRedirects = {
    'invalid-xml': '/returns/upload?error=invalidxml'
  };

  // Once the status has been updated to 'validated', redirect to success page
  const status = get(data, [0, 'status']);
  if (status in statusActions) {
    return h.redirect(statusActions[status]);
  } else if (status === 'error') {
    // get error details and redirect accordingly
    const error = get(data, [0, 'metadata', 'error', 'key']);
    return h.redirect(errorRedirects[error]);
  }

  return h.view('nunjucks/returns/processing-upload.njk', view, { layout: false });
};

exports.errorMessages = errorMessages;
exports.getXmlUpload = getXmlUpload;
exports.postXmlUpload = postXmlUpload;
exports.getSpinnerPage = getSpinnerPage;
