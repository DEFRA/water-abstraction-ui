const { get } = require('lodash');
const Boom = require('boom');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const { uploadForm } = require('../forms/upload');
const water = require('../../../lib/connectors/water.js');
const files = require('../../../lib/files');
const uploadHelpers = require('../lib/upload-helpers');
const uploadSummaryHelpers = require('../lib/upload-summary-helpers');
const logger = require('../../../lib/logger');
const waterReturns = require('../../../lib/connectors/water-service/returns');
const confirmForm = require('../forms/confirm-upload');

/**
 * Upload xml return
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
const getXmlUpload = (request, h) => {
  const f = uploadForm(request);

  const error = get(request, 'query.error');

  const view = {
    ...request.view,
    pageTitle: 'Upload XML returns data',
    form: uploadHelpers.applyFormError(f, error)
  };

  return h.view('nunjucks/returns/upload.njk', view, { layout: false });
};

/**
 * Gets the path to redirect to after a file has been uploaded
 * @param  {String} status  - the file upload status
 * @param  {String} eventId - the water service event ID
 * @return {String}         - the path to redirect to
 */
const getRedirectPath = (status, eventId) => {
  const paths = {
    [uploadHelpers.fileStatuses.VIRUS]: '/returns/upload?error=virus',
    [uploadHelpers.fileStatuses.NOT_XML]: '/returns/upload?error=notxml',
    [uploadHelpers.fileStatuses.OK]: `/returns/processing-upload/${eventId}`
  };
  return paths[status];
};

/**
 * Post handler for xml upload
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
async function postXmlUpload (request, h) {
  let eventId, redirectPath;
  const localPath = uploadHelpers.getFile();

  try {
    // Store file locally and run checks
    await uploadHelpers.createDirectory(localPath);
    await uploadHelpers.uploadFile(request.payload.file, localPath);
    const status = await uploadHelpers.getUploadedFileStatus(localPath);

    // Upload to water service and get event ID
    if (status === uploadHelpers.fileStatuses.OK) {
      const userName = get(request, 'auth.credentials.username');
      const fileData = await files.readFile(localPath);

      // Send XML return data to API and get event ID for upload
      const postData = await waterReturns.postXML(fileData.toString(), userName);
      eventId = get(postData, 'data.eventId');
    }

    redirectPath = getRedirectPath(status, eventId);
  } catch (error) {
    logger.error('Error with XML upload checks', error);
    throw error;
  } finally {
    // Delete temporary file
    await files.deleteFile(localPath);
  }

  return h.redirect(redirectPath);
}

const isError = evt => get(evt, 'status') === 'error';
const isValidated = evt => get(evt, 'status') === 'validated';

const getSpinnerRedirectPath = (evt) => {
  // If error redirect to error page
  if (isError(evt)) {
    const errorType = get(evt, 'metadata.error.key', 'default');
    return `/returns/upload?error=${errorType}`;
  }

  const eventId = get(evt, 'event_id');

  if (isValidated(evt)) {
    return `/returns/upload-summary/${eventId}`;
  }
};

const getUploadEvent = async (eventId, userName) => {
  const filter = {
    event_id: eventId,
    issuer: userName,
    type: 'returns-upload'
  };

  // Get data from event database
  const { data: [ evt ], error } = await water.events.findMany(filter);
  throwIfError(error);
  return evt;
};

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

  const evt = await getUploadEvent(eventId, userName);

  if (evt) {
    const path = getSpinnerRedirectPath(evt);

    if (path) {
      return h.redirect(path);
    }

    return h.view('nunjucks/returns/processing-upload.njk', view, { layout: false });
  } else {
    logger.error('No event found with selected event_id and issuer', { eventId });
    throw Boom.notFound(`Upload event not found`, { eventId });
  }

  // if (!evt) {
  //
  // }
  // const filter = {
  //   event_id: eventId,
  //   issuer: userName,
  //   type: 'returns-upload'
  // };
  //
  // // Get data from event database
  // const { data, error } = await water.events.findMany(filter);
  // throwIfError(error);
  //
  // // console.log(getSpinnerRedirectPath(data[0]));
  // // console.log(data);
  //
  // const statusActions = {
  //   validated: `/returns/upload-summary/${eventId}`,
  //   undefined: '/returns/upload?error=uploaderror'
  // };
  //
  // const errorRedirects = {
  //   'invalid-xml': '/returns/upload?error=invalidxml'
  // };
  //
  // // Once the status has been updated to 'validated', redirect to success page
  // const status = get(data, [0, 'status']);
  // if (status in statusActions) {
  //   return h.redirect(statusActions[status]);
  // } else if (status === 'error') {
  //   // get error details and redirect accordingly
  //   const error = get(data, [0, 'metadata', 'error', 'key']);
  //   return h.redirect(errorRedirects[error]);
  // }
  //
  // return h.view('nunjucks/returns/processing-upload.njk', view, { layout: false });
};

const pageTitles = {
  ok: 'Your data is ready to send',
  error: 'There are some problems with your data'
};

const hasErrors = grouped => get(grouped, 'returnsWithErrors.length') > 0;

/**
 * A page to show a summary of the data before it is submitted
 * @param  {String} request.params.eventId
 */
const getSummary = async (request, h) => {
  const { eventId } = request.params;
  const options = uploadSummaryHelpers.mapRequestOptions(request);
  try {
    const returns = await waterReturns.getUploadPreview(eventId, options);

    const grouped = uploadSummaryHelpers.groupReturns(returns, eventId);
    const form = confirmForm(request, grouped.returnsWithoutErrors.length);

    const view = {
      back: '/returns/upload',
      ...request.view,
      ...grouped,
      form,
      pageTitle: hasErrors(grouped) ? pageTitles.error : pageTitles.ok
    };

    return h.view('nunjucks/returns/upload-summary.njk', view, { layout: false });
  } catch (err) {
    const params = { eventId, options };
    logger.error(`Return upload error`, params);
    throw err;
  }
};

/**
 * A page to preview a single uploaded return before submission
 * together with its metadata and all quantity lines
 * @param  {String} request.params.eventId - the upload event ID
 * @param {String} request.params.returnId - the return service ID to display
 */
const getSummaryReturn = async (request, h) => {
  const { eventId, returnId } = request.params;
  const options = uploadSummaryHelpers.mapRequestOptions(request);
  try {
    const ret = await waterReturns.getUploadPreview(eventId, options, returnId);

    const returnData = uploadSummaryHelpers.mapReturn(ret, eventId);

    const view = {
      back: `/returns/upload-summary/${eventId}`,
      ...request.view,
      return: returnData,
      pageTitle: `Check your return reference ${returnData.returnRequirement}`,
      lines: uploadSummaryHelpers.groupLines(ret)
    };

    return h.view('nunjucks/returns/upload-return.njk', view, { layout: false });
  } catch (err) {
    const params = { eventId, returnId, options };
    logger.error(`Return upload error`, params);
    throw err;
  }
};

// exports.errorMessages = errorMessages;
exports.getXmlUpload = getXmlUpload;
exports.postXmlUpload = postXmlUpload;
exports.getSpinnerPage = getSpinnerPage;
exports.getSummary = getSummary;
exports.getSummaryReturn = getSummaryReturn;
exports.pageTitles = pageTitles;
