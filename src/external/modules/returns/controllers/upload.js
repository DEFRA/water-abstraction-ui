const { get, isEmpty, lowerCase } = require('lodash')
const Boom = require('@hapi/boom')

const { uploadForm } = require('../forms/upload')
const files = require('../../../../shared/lib/files')
const { logger } = require('../../../logger')
const config = require('../../../config')
const services = require('../../../lib/connectors/services')
const fileCheck = require('../../../../shared/lib/file-check')
const UploadHelpers = require('../../../../shared/lib/upload-helpers')
const validTypes = ['csv']
const uploadHelpers = new UploadHelpers('returns', validTypes, services, logger, config.testMode)
const { NO_FILE, OK } = UploadHelpers.fileStatuses
const uploadSummaryHelpers = require('../lib/upload-summary-helpers')
const csvTemplates = require('../lib/csv-templates')

const confirmForm = require('../forms/confirm-upload')
const helpers = require('../lib/helpers')

uploadHelpers.spinnerConfig = {
  processing: {
    await: 'ready',
    path: '/returns/upload-summary',
    errorPath: '/returns/upload',
    pageTitle: 'Uploading returns data'
  },
  submitting: {
    await: 'submitted',
    path: '/returns/upload-submitted',
    errorPath: '/returns/upload',
    pageTitle: 'Submitting returns data'
  }
}

const errorMessages = {
  'invalid-date-format': 'The date format must only include DD/MM/YYYY'
}
validTypes.forEach(type => {
  errorMessages[`invalid-${type}`] = 'The selected file must use the template'
})

uploadHelpers.bespokeErrorMessages = errorMessages

/**
 * Upload bulk returns data
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
const getBulkUpload = (request, h) => {
  const f = uploadForm(request)

  const error = get(request, 'query.error')

  const view = {
    ...request.view,
    pageTitle: 'Upload bulk returns data',
    form: uploadHelpers.applyFormError(f, error),
    back: '/returns/upload-instructions'
  }

  return h.view('nunjucks/returns/upload', view)
}

/**
 * Post handler for bulk upload
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
async function postBulkUpload (request, h) {
  let eventId, redirectPath

  if (request.payload.file.hapi && !request.payload.file.hapi.filename) {
    return h.redirect(uploadHelpers.getRedirectPath(NO_FILE))
  }

  const localPath = uploadHelpers.getFile()

  try {
    // Store file locally and run checks
    await uploadHelpers.createDirectory(localPath)
    await uploadHelpers.uploadFile(request.payload.file, localPath)

    // Detect type of uploaded file
    const type = await fileCheck.detectFileType(localPath)

    const status = await uploadHelpers.getUploadedFileStatus(localPath, type)

    // Upload to water service and get event ID
    if (status === OK) {
      const { userName, companyId } = request.defra
      const fileData = await files.readFile(localPath)

      // Send bulk return data to API and get event ID for upload
      const postData = await services.water.returns.postUpload(fileData.toString(), userName, companyId, type)
      eventId = get(postData, 'data.eventId')
    }

    redirectPath = uploadHelpers.getRedirectPath(status, eventId)
  } catch (error) {
    logger.errorWithJourney('Error with bulk upload checks', error, request)
    throw error
  } finally {
    // Delete temporary file
    await files.deleteFile(localPath)
  }

  return h.redirect(redirectPath)
}

const pageTitles = {
  ok: 'Your data is ready to send',
  error: 'There are some problems with your data'
}

const hasErrors = grouped => get(grouped, 'returnsWithErrors.length') > 0

/**
 * A page to show a summary of the data before it is submitted
 * @param  {String} request.params.eventId
 */
const getSummary = async (request, h) => {
  const { eventId } = request.params
  const { userName } = request.defra

  const options = uploadSummaryHelpers.mapRequestOptions(request)

  try {
    // get view data from event metadata
    const evt = await uploadHelpers.getUploadEvent(eventId, userName)
    const grouped = uploadSummaryHelpers.groupReturns(get(evt.metadata, 'validationResults'), eventId)

    if (isEmpty(grouped)) {
      return h.redirect('/returns/upload?error=empty')
    }

    const form = confirmForm(request, get(grouped, 'returnsWithoutErrors.length', 0))

    const view = {
      back: '/returns/upload',
      ...request.view,
      ...grouped,
      form,
      pageTitle: hasErrors(grouped) ? pageTitles.error : pageTitles.ok
    }

    return h.view('nunjucks/returns/upload-summary', view)
  } catch (err) {
    const params = { eventId, options }
    logger.errorWithJourney('Return upload error', err, request, params)
    throw err
  }
}

/**
 * A page to preview a single uploaded return before submission
 * together with its metadata and all quantity lines
 * @param  {String} request.params.eventId - the upload event ID
 * @param {String} request.params.returnId - the return service ID to display
 */
const getSummaryReturn = async (request, h) => {
  const { eventId, returnId } = request.params
  const options = uploadSummaryHelpers.mapRequestOptions(request)
  try {
    const ret = await services.water.returns.getUploadPreview(eventId, options, returnId)

    const returnData = uploadSummaryHelpers.mapReturn(ret, eventId)

    const view = {
      back: `/returns/upload-summary/${eventId}`,
      ...request.view,
      return: returnData,
      pageTitle: `Check your return reference ${returnData.returnRequirement}`,
      lines: uploadSummaryHelpers.groupLines(ret)
    }

    return h.view('nunjucks/returns/upload-return', view)
  } catch (err) {
    const params = { eventId, returnId, options }
    logger.errorWithJourney('Return upload error', err, request, params)
    throw err
  }
}

/**
 * Submit valid returns within the uploaded data
 * This:
 * - Posts data to the water service to kick of return submission process
 * - Redirects to page with success message
 * @param  {String} request.params.eventId - the upload event ID
 */
const postSubmit = async (request, h) => {
  const { eventId } = request.params
  const options = uploadSummaryHelpers.mapRequestOptions(request)
  try {
    await services.water.returns.postUploadSubmit(eventId, options)

    // Redirect to spinner page while event resolves
    return h.redirect(`/returns/processing-upload/submitting/${eventId}`)
  } catch (err) {
    const params = { eventId, options }
    logger.errorWithJourney('Return upload error', err, request, params)
    throw err
  }
}

/**
 * Page to render a success message
 */
const getSubmitted = async (request, h) => {
  const { bulkUpload } = await helpers.getReturnsViewData(request)
  const { eventId } = request.params
  logger.info('Return upload submitted', { eventId })
  const view = {
    ...request.view,
    pageTitle: 'Returns submitted',
    bulkUpload
  }
  return h.view('nunjucks/returns/upload-submitted', view)
}

const getZipFilename = (companyName) => `${lowerCase(companyName)} return templates.zip`

/**
 * Downloads a ZIP of CSV templates
 */
const getCSVTemplates = async (request, h) => {
  const { companyId, companyName } = request.defra

  // Fetch returns for current company
  const returns = await services.water.companies.getCurrentDueReturns(companyId)

  if (returns.length === 0) {
    throw Boom.notFound('CSV templates error - no current due returns', { companyId })
  }

  const endDate = returns[0].endDate

  // Generate CSV data and build zip
  const data = csvTemplates.createCSVData(returns)
  const zip = await csvTemplates.buildZip(data, companyName)
  const fileName = getZipFilename(companyName)

  return h.response(zip)
    .header('Content-type', 'application/zip')
    .header('Content-disposition', `attachment; filename="${fileName}"`)
}

/**
 * Provides the user with instructions on how to upload bulk returns, and
 * a link to download their CSV templates as a ZIP file
 */
const getUploadInstructions = async (request, h) => {
  const { view } = request
  return h.view('nunjucks/returns/upload-instructions', view)
}

exports.getBulkUpload = getBulkUpload
exports.postBulkUpload = postBulkUpload
exports.getSpinnerPage = uploadHelpers.getSpinnerPage()
exports.getSummary = getSummary
exports.getSummaryReturn = getSummaryReturn
exports.pageTitles = pageTitles
exports.postSubmit = postSubmit
exports.getSubmitted = getSubmitted
exports.getCSVTemplates = getCSVTemplates
exports.getUploadInstructions = getUploadInstructions
