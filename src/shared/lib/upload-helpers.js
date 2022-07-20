const { get, set } = require('lodash')
const fileCheck = require('shared/lib/file-check')
const { applyErrors } = require('shared/lib/forms')
const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')
const { throwIfError } = require('@envage/hapi-pg-rest-api')
const Boom = require('@hapi/boom')

class UploadHelpers {
  constructor (uploadType, validTypes, services, logger, testMode) {
    this._uploadType = uploadType
    this._validTypes = validTypes.map(type => type.toLowerCase())
    this._validTypesText = validTypes.map(type => type.toUpperCase()).join(' or ')
    this._services = services
    this._logger = logger
    this._testMode = testMode
  }

  set spinnerConfig (config) {
    this._spinnerConfig = config
  }

  get spinnerConfig () {
    return this._spinnerConfig
  }

  set bespokeErrorMessages (errorMessages) {
    this._errorMessages = errorMessages
  }

  get bespokeErrorMessages () {
    return this._errorMessages
  }

  /**
   * Get path to temp folder & assign uuid filename
   * @return {string} - path to temp file
   */
  getFile () {
    return path.join(process.cwd(), `/temp/${uuid()}`)
  }

  getErrorMessage (key = 'default') {
    const errorMessages = {
      'invalid-type': `The selected file must be a ${this._validTypesText} file`,
      'no-file': `Select a ${this._validTypesText} file`,
      virus: 'The selected file contains a virus',
      empty: 'The selected file has no returns data in it',
      default: 'The selected file could not be uploaded – try again',
      ...this._errorMessages
    }
    return errorMessages[key] || errorMessages.default
  }

  /**
   * Set error message if there is an error
   * @param {object} form - form object
   * @param {string} error - error message, if exists
   * @param {string} link - link, if exists
   * @return {object} - form object
   */
  applyFormError (form, error, link) {
    if (error) {
      const errors = {
        message: this.getErrorMessage(error),
        name: 'file'
      }
      if (link) {
        errors.link = link
      }
      return applyErrors(form, [errors])
    }
    return form
  }

  /**
   * Upload file to temporary location
   * @param {object} readStream - stream of uploaded file
   * @param {string} file - name & location of temp file
   * @return {Promise} - to upload temporary file
   */
  uploadFile (readStream, file) {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(file)

      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
      readStream.on('error', reject)

      readStream.pipe(writeStream)
    })
  }

  async createDirectory (file) {
    return new Promise(resolve => fs.mkdir(path.dirname(file), { recursive: true }, resolve))
  }

  static get fileStatuses () {
    return {
      OK: 'ok',
      VIRUS: 'virus',
      INVALID_TYPE: 'invalid-type',
      INVALID_ROWS: 'invalid-csv-rows',
      NO_FILE: 'no-file'
    }
  }

  /**
   * Gets the status of the uploaded file from the list of possible statuses
   * above.
   * Runs virus check and file check on the supplied file and returns
   * one of the possible statuses depending on the outcome of the checks
   * @param {String} file - the uploaded file path to check
   * @param {String} type - the detected file type
   * @return {String} status string
   */
  async getUploadedFileStatus (file, type) {
    // Run virus check on temp file
    const { VIRUS, OK, INVALID_TYPE } = UploadHelpers.fileStatuses
    // const checkResult = this._testMode ? { isClean: true } : await fileCheck.virusCheck(file)
    const checkResult = await fileCheck.virusCheck(file)
    // Set redirectUrl if virusCheck failed
    if (!checkResult.isClean) {
      this._logger.error('Uploaded file failed virus scan', checkResult.err)
      return VIRUS
    }

    // Set redirectUrl if incorrect file type
    return (this._validTypes.includes(type)) ? OK : INVALID_TYPE
  }

  /**
   * Gets the path to redirect to after a file has been uploaded
   * @param  {String} status  - the file upload status
   * @param  {String} eventId - the water service event ID
   * @param  {String} filename - the file upload filename (optional)
   * @return {String}         - the path to redirect to
   */
  getRedirectPath (status, eventId, filename) {
    const { VIRUS, OK, NO_FILE, INVALID_TYPE } = UploadHelpers.fileStatuses
    const query = filename ? `?filename=${filename}` : ''
    switch (status) {
      case VIRUS: return `/${this._uploadType}/upload?error=virus`
      case INVALID_TYPE: return `/${this._uploadType}/upload?error=invalid-type`
      case NO_FILE: return `/${this._uploadType}/upload?error=no-file`
      case OK: return `/${this._uploadType}/processing-upload/processing/${eventId}${query}`
      default: throw new Error(status)
    }
  }

  isError (evt) {
    return get(evt, 'status') === 'error'
  }

  /**
   * Gets the path the spinner page will redirect to.
   * If the event is in error status, it always redirects back to the upload
   * form with a relevant error status.
   * Otherwise it redirects to the next page in the flow depending on the 'status'
   *
   * @param  {Object} evt    - event data loaded from water service
   * @param  {String} status - success status we are awaiting
   * @param {String} pathPrefix - the pathPrefix to redirect to if event status matches status
   *                        the event ID is appended to this path
   * @param {String} errorPath - the errorPath to redirect to if the event is in error state
   *                        the event ID replaces the wildcard if it exists
   * @return {String|Undefined} - URL path to redirect to
   */
  getSpinnerRedirectPath (evt, status, pathPrefix, errorPath) {
    // If error redirect to error page
    let redirectPath

    if (this.isError(evt)) {
      const errorType = get(evt, 'metadata.error.key', 'default')
      redirectPath = `${errorPath.replace('{{eventId}}', evt.event_id)}?error=${errorType}`
    } else if (evt.status === status) {
      redirectPath = `${pathPrefix}/${evt.event_id}`
    }

    return redirectPath
  }

  /**
   * Retrieves the upload event from the water service
   * @param  {String}  eventId  - water service event GUID
   * @param  {String}  userName - current user's email address
   * @return {Promise}          resolves with row of event data
   */
  async getUploadEvent (eventId, userName) {
    const filter = {
      event_id: eventId,
      issuer: userName,
      type: `${this._uploadType}-upload`
    }

    // Get data from event database
    const { data: [evt], error } = await this._services.water.events.findMany(filter)
    throwIfError(error)
    return evt
  }

  /**
   * Returns the controller to get the spinner page - see below.
   */
  getSpinnerPage () {
    const { spinnerConfig } = this
    /**
     * Waiting page to be diplayed whilst uploaded data is being processed,
     * page refreshes every 5 seconds and checks the status of the event
     * @param {Object} request - HAPI HTTP request
     * @param {Object} h - HAPI HTTP reply
     */
    return async (request, h) => {
      // Get data from request
      const { eventId, status } = request.params
      const { filename = '' } = request.query || {}
      const config = spinnerConfig[status]
      const { userName } = request.defra

      // Set page title
      set(request, 'view.pageTitle', config.pageTitle.replace('{{filename}}', filename))

      // Load event data from water service
      const evt = await this.getUploadEvent(eventId, userName)

      if (evt) {
        const spinnerRedirectPath = this.getSpinnerRedirectPath(evt, config.await, config.path, config.errorPath)

        if (spinnerRedirectPath) {
          return h.redirect(spinnerRedirectPath)
        }

        const statusMessage = get(evt, 'metadata.statusMessage') || ''

        return h.view('nunjucks/waiting/index', {
          ...request.view,
          statusMessage
        })
      } else {
        const error = Boom.notFound('Upload event not found', { eventId })
        this._logger.errorWithJourney('No event found with selected event_id and issuer', error, request, { eventId })
        throw error
      }
    }
  }
}

module.exports = UploadHelpers
