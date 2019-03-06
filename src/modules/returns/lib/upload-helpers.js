const { get } = require('lodash');
const { applyErrors } = require('../../../lib/forms');
const fileCheck = require('../../../lib/file-check');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');
const util = require('util');
const mkdirp = util.promisify(require('mkdirp'));

/**
 * Get path to temp folder & assign uuid filename
 * @return {string} - path to temp file
 */
const getFile = () => {
  return path.join(process.cwd(), `/temp/${uuidv4()}.xml`);
};

const getErrorMessage = (key) => {
  const errorMessages = {
    'invalid-xml': 'The selected file must use the template',
    notxml: 'The selected file must be an XML',
    virus: 'The selected file contains a virus'
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
  NOT_XML: 'not-xml'
};

/**
 * Gets the status of the uploaded file from the list of possible statuses
 * above.
 * Runs virus check and XML file check on the supplied file and returns
 * one of the possible statuses depending on the outcome of the checks
 * @param {String} file - the uploaded file path to check
 * @return {String} status string
 */
const getUploadedFileStatus = async file => {
  // Run virus check on temp file
  const isClean = await fileCheck.virusCheck(file);
  // Set redirectUrl if virusCheck failed
  if (!isClean) {
    return fileStatuses.VIRUS;
  }

  // Check that file is an xml file
  const isCorrectType = fileCheck.isXml(file);
  // Set redirectUrl if isXml failed
  if (!isCorrectType) {
    return fileStatuses.NOT_XML;
  }

  return fileStatuses.OK;
};

exports.getFile = getFile;
exports.applyFormError = applyFormError;
exports.uploadFile = uploadFile;
exports.getUploadedFileStatus = getUploadedFileStatus;
exports.fileStatuses = fileStatuses;
exports.createDirectory = createDirectory;
