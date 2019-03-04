const { applyErrors } = require('../../../lib/forms');
const fileCheck = require('../../../lib/file-check');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');

/**
 * Get path to temp folder & assign uuid filename
 * @return {string} - path to temp file
 */
const getFile = () => {
  return path.join(process.cwd(), `/temp/${uuidv4()}.xml`);
};

/**
 * Set error message if there is an error
 * @param {object} form - form object
 * @param {string} error - error message, if exists
 * @return {object} - form object
 */
const applyFormError = (form, error, errorMessages) => {
  if (error) {
    return applyErrors(form, [{
      message: errorMessages[error],
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

/**
 * Run virus scan and check if file is an XML
 * @param {string} file - name & location of temp file
 * @return {string} - url to redirect to if a check fails or undefined
 */
const runChecks = async (file) => {
  let redirectUrl;

  // Run virus check on temp file
  const isClean = await fileCheck.virusCheck(file);
  // Set redirectUrl if virusCheck failed
  if (!isClean) {
    redirectUrl = '/returns/upload?error=virus';
  }

  // Check that file is an xml file
  const isCorrectType = fileCheck.isXml(file);
  // Set redirectUrl if isXml failed
  if (!isCorrectType) {
    redirectUrl = '/returns/upload?error=notxml';
  }

  return redirectUrl;
};

exports.getFile = getFile;
exports.applyFormError = applyFormError;
exports.uploadFile = uploadFile;
exports.runChecks = runChecks;
