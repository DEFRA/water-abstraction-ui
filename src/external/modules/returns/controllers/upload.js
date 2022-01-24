const { get, set, isEmpty, lowerCase } = require('lodash');
const Boom = require('@hapi/boom');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const { uploadForm } = require('../forms/upload');
const files = require('../../../../shared/lib/files');
const uploadHelpers = require('../lib/upload-helpers');
const uploadSummaryHelpers = require('../lib/upload-summary-helpers');
const { logger } = require('../../../logger');
const services = require('../../../lib/connectors/services');
const fileCheck = require('../../../../shared/lib/file-check');
const csvTemplates = require('../lib/csv-templates');

const confirmForm = require('../forms/confirm-upload');
const helpers = require('../lib/helpers');

const spinnerConfig = {
  processing: {
    await: 'ready',
    path: '/returns/upload-summary',
    pageTitle: 'Uploading returns data'
  },
  submitting: {
    await: 'submitted',
    path: '/returns/upload-submitted',
    pageTitle: 'Submitting returns data'
  }
};

/**
 * Upload bulk returns data
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
const getBulkUpload = (request, h) => {
  const f = uploadForm(request);

  const error = get(request, 'query.error');

  const view = {
    ...request.view,
    pageTitle: 'Upload bulk returns data',
    form: uploadHelpers.applyFormError(f, error),
    back: '/returns/upload-instructions'
  };

  return h.view('nunjucks/returns/upload', view);
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
    [uploadHelpers.fileStatuses.INVALID_TYPE]: '/returns/upload?error=invalid-type',
    [uploadHelpers.fileStatuses.NO_FILE]: '/returns/upload?error=no-file',
    [uploadHelpers.fileStatuses.OK]: `/returns/processing-upload/processing/${eventId}`
  };
  return paths[status];
};

/**
 * Post handler for bulk upload
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
async function postBulkUpload (request, h) {
  let eventId, redirectPath;

  if (request.payload.file.hapi && !request.payload.file.hapi.filename) {
    return h.redirect(getRedirectPath(uploadHelpers.fileStatuses.NO_FILE));
  }

  const localPath = uploadHelpers.getFile();

  try {
    // Store file locally and run checks
    await uploadHelpers.createDirectory(localPath);
    await uploadHelpers.uploadFile(request.payload.file, localPath);

    // Detect type of uploaded file
    const type = await fileCheck.detectFileType(localPath);

    const status = await uploadHelpers.getUploadedFileStatus(localPath, type);

    // Upload to water service and get event ID
    if (status === uploadHelpers.fileStatuses.OK) {
      const { userName, companyId } = request.defra;
      const fileData = await files.readFile(localPath);

      // Send bulk return data to API and get event ID for upload
      const postData = await services.water.returns.postUpload(fileData.toString(), userName, companyId, type);
      eventId = get(postData, 'data.eventId');
    }

    redirectPath = getRedirectPath(status, eventId);
  } catch (error) {
    logger.errorWithJourney('Error with bulk upload checks', error, request);
    throw error;
  } finally {
    // Delete temporary file
    await files.deleteFile(localPath);
  }

  return h.redirect(redirectPath);
}

const isError = evt => get(evt, 'status') === 'error';

/**
 * Gets the path the spinner page will redirect to.
 * If the event is in error status, it always redirects back to the upload
 * form with a relevant error status.
 * Otherwise it redirects to the next page in the flow depending on the 'status'
 *
 * @param  {Object} evt    - event data loaded from water service
 * @param  {String} status - success status we are awaiting
 * @param {String} path - the path to redirect to if event status matches status
 *                        the event ID is appended to this path
 * @return {String|Undefined} - URL path to redirect to
 */
const getSpinnerRedirectPath = (evt, status, path) => {
  // If error redirect to error page
  if (isError(evt)) {
    const errorType = get(evt, 'metadata.error.key', 'default');
    return `/returns/upload?error=${errorType}`;
  }

  if (evt.status === status) {
    return `${path}/${evt.event_id}`;
  }
};

/**
 * Retrieves the upload event from the water service
 * @param  {String}  eventId  - water service event GUID
 * @param  {String}  userName - current user's email address
 * @return {Promise}          resolves with row of event data
 */
const getUploadEvent = async (eventId, userName) => {
  const filter = {
    event_id: eventId,
    issuer: userName,
    type: 'returns-upload'
  };

  // Get data from event database
  const { data: [evt], error } = await services.water.events.findMany(filter);
  throwIfError(error);
  return evt;
};

/**
 * Waiting page to be diplayed whilst bulk return is being processed,
 * page refreshes every 5 seconds and checks the status of the event
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
const getSpinnerPage = async (request, h) => {
  // Get data from request
  const { eventId, status } = request.params;
  const config = spinnerConfig[status];
  const { userName } = request.defra;

  // Set page title
  set(request, 'view.pageTitle', config.pageTitle);

  // Load event data from water service
  const evt = await getUploadEvent(eventId, userName);

  if (evt) {
    const path = getSpinnerRedirectPath(evt, config.await, config.path);

    if (path) {
      return h.redirect(path);
    }

    return h.view('nunjucks/waiting/index', request.view);
  } else {
    const error = Boom.notFound('Upload event not found', { eventId });
    logger.errorWithJourney('No event found with selected event_id and issuer', error, request, { eventId });
    throw error;
  }
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
  const { userName } = request.defra;

  const options = uploadSummaryHelpers.mapRequestOptions(request);

  try {
    // get view data from event metadata
    const evt = await getUploadEvent(eventId, userName);
    const grouped = uploadSummaryHelpers.groupReturns(get(evt.metadata, 'validationResults'), eventId);

    if (isEmpty(grouped)) {
      return h.redirect('/returns/upload?error=empty');
    }

    const form = confirmForm(request, get(grouped, 'returnsWithoutErrors.length', 0));

    const view = {
      back: '/returns/upload',
      ...request.view,
      ...grouped,
      form,
      pageTitle: hasErrors(grouped) ? pageTitles.error : pageTitles.ok
    };

    return h.view('nunjucks/returns/upload-summary', view);
  } catch (err) {
    const params = { eventId, options };
    logger.errorWithJourney('Return upload error', err, request, params);
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
    const ret = await services.water.returns.getUploadPreview(eventId, options, returnId);

    const returnData = uploadSummaryHelpers.mapReturn(ret, eventId);

    const view = {
      back: `/returns/upload-summary/${eventId}`,
      ...request.view,
      return: returnData,
      pageTitle: `Check your return reference ${returnData.returnRequirement}`,
      lines: uploadSummaryHelpers.groupLines(ret)
    };

    return h.view('nunjucks/returns/upload-return', view);
  } catch (err) {
    const params = { eventId, returnId, options };
    logger.errorWithJourney('Return upload error', err, request, params);
    throw err;
  }
};

/**
 * Submit valid returns within the uploaded data
 * This:
 * - Posts data to the water service to kick of return submission process
 * - Redirects to page with success message
 * @param  {String} request.params.eventId - the upload event ID
 */
const postSubmit = async (request, h) => {
  const { eventId } = request.params;
  const options = uploadSummaryHelpers.mapRequestOptions(request);
  try {
    await services.water.returns.postUploadSubmit(eventId, options);

    // Redirect to spinner page while event resolves
    return h.redirect(`/returns/processing-upload/submitting/${eventId}`);
  } catch (err) {
    const params = { eventId, options };
    logger.errorWithJourney('Return upload error', err, request, params);
    throw err;
  }
};

/**
 * Page to render a success message
 */
const getSubmitted = async (request, h) => {
  const { bulkUpload } = await helpers.getReturnsViewData(request);
  const { eventId } = request.params;
  logger.info('Return upload submitted', { eventId });
  const view = {
    ...request.view,
    pageTitle: 'Returns submitted',
    bulkUpload
  };
  return h.view('nunjucks/returns/upload-submitted', view);
};

const getZipFilename = (companyName, year) => `${lowerCase(companyName)} return templates ${year}.zip`;

/**
 * Downloads a ZIP of CSV templates
 */
const getCSVTemplates = async (request, h) => {
  const { companyId, companyName } = request.defra;

  // Fetch returns for current company
  const returns = await services.water.companies.getCurrentDueReturns(companyId);

  if (returns.length === 0) {
    throw Boom.notFound('CSV templates error - no current due returns', { companyId });
  }

  const endDate = returns[0].endDate;

  // Generate CSV data and build zip
  const data = csvTemplates.createCSVData(returns);
  const zip = await csvTemplates.buildZip(data, companyName);
  const fileName = getZipFilename(companyName, endDate.substring(0, 4));

  return h.response(zip)
    .header('Content-type', 'application/zip')
    .header('Content-disposition', `attachment; filename="${fileName}"`);
};

/**
 * Provides the user with instructions on how to upload bulk returns, and
 * a link to download their CSV templates as a ZIP file
 */
const getUploadInstructions = async (request, h) => {
  const { view } = request;
  return h.view('nunjucks/returns/upload-instructions', view);
};

exports.getBulkUpload = getBulkUpload;
exports.postBulkUpload = postBulkUpload;
exports.getSpinnerPage = getSpinnerPage;
exports.getSummary = getSummary;
exports.getSummaryReturn = getSummaryReturn;
exports.pageTitles = pageTitles;
exports.postSubmit = postSubmit;
exports.getSubmitted = getSubmitted;
exports.getCSVTemplates = getCSVTemplates;
exports.getUploadInstructions = getUploadInstructions;
