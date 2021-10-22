const { get } = require('lodash');
const fileCheck = require('shared/lib/file-check');
const { applyErrors } = require('shared/lib/forms');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');
const util = require('util');
const mkdirp = util.promisify(require('mkdirp'));
const { logger } = require('../../../logger');
const config = require('../../../config');

/**
 * Get path to temp folder & assign uuid filename
 * @return {string} - path to temp file
 */
const getFile = () => {
  return path.join(process.cwd(), `/temp/${uuidv4()}`);
};

const getErrorMessage = key => {
  const errorMessages = {
    'invalid-xml': 'The selected file must use the template',
    'invalid-csv': 'The selected file must use the template',
    'invalid-type': 'The selected file must be a CSV or XML file',
    'no-file': 'Select a CSV or XML file',
    virus: 'The selected file contains a virus',
    empty: 'The selected file has no returns data in it',
    'invalid-date-format': 'The date format must only include DD/MM/YYYY'
  };
  const defaultMessage = 'The selected file could not be uploaded – try again';
  return get(errorMessages, key, defaultMessage);
};

/**
 * Set error message if there is an error
 * @param {object} form - form object
 * @param {string} error - error message, if exists
 * @return {object} - form object
 */
const applyFormError = (form, error) => {
  if (error) {
    return applyErrors(form, [{
      message: getErrorMessage(error),
      name: 'file'
    }]);
  }
  return form;
};

/**
 * Upload file to temporary location
 * @param {object} readStream - stream of uploaded file
 * @param {string} file - name & location of temp file
 * @return {Promise} - to upload temporary file
 */
const uploadFile = (readStream, file) => {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(file);

    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    readStream.on('error', reject);

    readStream.pipe(writeStream);
  });
};

const createDirectory = file => mkdirp(path.dirname(file));

const fileStatuses = {
  OK: 'ok',
  VIRUS: 'virus',
  INVALID_TYPE: 'invalid-type',
  NO_FILE: 'no-file'
};

/**
 * Gets the status of the uploaded file from the list of possible statuses
 * above.
 * Runs virus check and file check on the supplied file and returns
 * one of the possible statuses depending on the outcome of the checks
 * @param {String} file - the uploaded file path to check
 * @param {String} type - the detected file type
 * @return {String} status string
 */
const getUploadedFileStatus = async (file, type) => {
  // Run virus check on temp file
  const checkResult = config.testMode ? { isClean: true } : await fileCheck.virusCheck(file);
  // Set redirectUrl if virusCheck failed
  if (!checkResult.isClean) {
    logger.error('Uploaded file failed virus scan', checkResult.err);
    return fileStatuses.VIRUS;
  }

  // Set redirectUrl if incorrect file type
  if (['csv', 'xml'].includes(type)) {
    return fileStatuses.OK;
  }

  return fileStatuses.INVALID_TYPE;
};

exports.getFile = getFile;
exports.applyFormError = applyFormError;
exports.uploadFile = uploadFile;
exports.getUploadedFileStatus = getUploadedFileStatus;
exports.fileStatuses = fileStatuses;
exports.createDirectory = createDirectory;
