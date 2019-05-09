const fs = require('fs');
const { pick } = require('lodash');
const fileType = require('file-type');
const readChunk = require('read-chunk');
const util = require('util');
const parseCsv = util.promisify(require('csv-parse'));
const helpers = require('./helpers');
const logger = require('./logger');

/**
 * Throws an error if the specified file does not exist
 * @param  {String} file - path to file
 */
const throwIfFileDoesNotExist = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`File not found: ${file}`);
  }
  return true;
};

const isInfectedFile = (err) => {
  return err.code === 1;
};

const createLoggerError = (err) => {
  const error = new Error(`Virus checker found infected file`);
  error.params = pick(err, ['code', 'cmd', 'stdout']);
  return error;
};

/**
 * Runs the Clam Scan virus check on a particular file
 * @param  {String}  file - the file to scan
 * @return {Promise}      - resolves with true if file clean, false if infected
 */
const clamScan = async (file) => {
  try {
    await helpers.exec(`clamdscan ${file}`);
    return true;
  } catch (err) {
    if (isInfectedFile(err)) {
      logger.error(createLoggerError(err));
      return false;
    }
    throw err;
  }
};

/**
 * Runs clamscan virus check on specified file
 * Throws error if virus present
 * @param  {String} file - path to file
 * @return {Boolean}     - true if successful
 */
const virusCheck = async (file) => {
  throwIfFileDoesNotExist(file);
  return clamScan(file);
};

/**
 * Checkes whether supplied file is XML.
 * If the file does not exist, an error is thrown
 * @param  {String}  file - path to file
 * @return {Boolean}
 */

/*
const isXml = file => {
  const buffer = readChunk.sync(file, 0, fileType.minimumBytes);
  const result = fileType(buffer);
  if (!result) {
    return false;
  }
  const xmlTypes = ['text/xml', 'application/xml'];
  return xmlTypes.includes(result.mime);
};
*/

const isCsv = async file => {
  try {
    await parseCsv(file);
    return true;
  } catch (err) {
    logger.info('invalid CSV', err);
    return false;
  }
};

const detectFileType = async (file) => {
  throwIfFileDoesNotExist(file);

  // Detect file types supported by file-type module
  const buffer = readChunk.sync(file, 0, fileType.minimumBytes);
  const result = fileType(buffer);
  if (result) {
    return result.ext;
  }

  // Detect CSV file
  const isCsvResult = await isCsv(file);
  if (isCsvResult) {
    return 'csv';
  }
};

module.exports = {
  throwIfFileDoesNotExist,
  clamScan,
  virusCheck,
  detectFileType
};
