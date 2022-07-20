const { get } = require('lodash')
const urlJoin = require('url-join')

const uploadForm = require('./form')
const files = require('shared/lib/files')
const { logger } = require('../../logger')
const config = require('../../config')
const services = require('../../lib/connectors/services')
const fileCheck = require('shared/lib/file-check')
const UploadHelpers = require('shared/lib/upload-helpers')
const uploadHelpers = new UploadHelpers('charge-information', ['csv'], services, logger, config.testMode)
const { NO_FILE, OK, INVALID_ROWS } = UploadHelpers.fileStatuses

uploadHelpers.spinnerConfig = {
  processing: {
    await: 'ready',
    path: '/charge-information/upload',
    errorPath: '/charge-information/upload/{{eventId}}',
    pageTitle: 'Uploading {{filename}}'
  }
}

uploadHelpers.bespokeErrorMessages = {
  [INVALID_ROWS]: 'Download a report of the errors',
  default: 'Unable to upload error'
}

/**
 * Upload charge information data
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
async function getUploadChargeInformation (request, h) {
  const eventId = get(request, 'params.eventId')
  let notification
  let errorFileLink

  if (eventId) {
    const { userName } = request.defra
    const evt = await uploadHelpers.getUploadEvent(eventId, userName)
    const { filename = '', rows = 0, error } = get(evt, 'metadata', {})
    if (error) {
      if (get(evt, 'metadata.error.key') === INVALID_ROWS) {
        errorFileLink = urlJoin(evt.event_id, `${filename.split('.')[0]}-error.csv`)
      }
    } else {
      const text = [`${filename} uploaded`, '', `${rows} rows successfully uploaded`].join('\n')
      notification = { text, type: 'success' }
    }
  }

  const f = uploadForm(request)

  const errorCode = get(request, 'query.error')

  const view = {
    ...request.view,
    pageTitle: 'Upload charge information',
    notification,
    form: uploadHelpers.applyFormError(f, errorCode, errorFileLink)
  }

  return h.view('nunjucks/charge-information/upload', view)
}

/**
 * Post handler for charge information upload
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
async function postUploadChargeInformation (request, h) {
  let eventId, redirectPath

  const file = get(request.payload, 'file', {})
  logger.info(file)
  const filename = get(file, 'hapi.filename')
  logger.info(filename)

  if (!filename) {
    return h.redirect(uploadHelpers.getRedirectPath(NO_FILE))
  }

  const localPath = uploadHelpers.getFile()
  logger.info(localPath)

  try {
    // Store file locally and run checks
    await uploadHelpers.createDirectory(localPath)
    await uploadHelpers.uploadFile(file, localPath)

    // Detect type of uploaded file
    const type = await fileCheck.detectFileType(localPath)

    const status = await uploadHelpers.getUploadedFileStatus(localPath, type)

    // Upload to water service and get event ID
    if (status === OK) {
      const { userName } = request.defra
      const fileData = await files.readFile(localPath)

      // Send charge information to API and get event ID for upload
      const postData = await services.water.chargeVersions.postUpload(fileData.toString(), userName, filename, type)
      eventId = get(postData, 'data.eventId')
    }

    redirectPath = uploadHelpers.getRedirectPath(status, eventId, filename)
  } catch (error) {
    logger.errorWithJourney('Error with charge information upload checks', error, request)
    throw error
  } finally {
    // Delete temporary file
    // Temporarily disable deletion just to see if files eventually arrive
    // await files.deleteFile(localPath)
  }

  return h.redirect(redirectPath)
}

async function getUploadChargeInformationErrorFile (request, h) {
  const { eventId } = request.params || {}
  const data = await services.water.chargeVersions.getUploadErrors(eventId)
  return h.response(data).type('text/csv')
}

const pageTitles = {
  ok: 'Your data is ready to send',
  error: 'There are some problems with your data'
}

exports.getUploadChargeInformation = getUploadChargeInformation
exports.postUploadChargeInformation = postUploadChargeInformation
exports.getUploadChargeInformationErrorFile = getUploadChargeInformationErrorFile
exports.getSpinnerPage = uploadHelpers.getSpinnerPage()
exports.pageTitles = pageTitles
