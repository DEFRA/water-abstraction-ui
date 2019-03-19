const fs = require('fs');
const { pick } = require('lodash');
const helpers = require('./helpers');
const logger = require('./logger');
const fileType = require('file-type');
const readChunk = require('read-chunk');

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
 * @param  {[type]}  file [description]
 * @return {Boolean}      [description]
 */
const isXml = (file) => {
  throwIfFileDoesNotExist(file);
  const buffer = readChunk.sync(file, 0, fileType.minimumBytes);
  const result = fileType(buffer);
  if (!result) {
    return false;
  }
  const xmlTypes = ['text/xml', 'application/xml'];
  return (result.ext === 'xml') && (xmlTypes.includes(result.mime));
};

module.exports = {
  throwIfFileDoesNotExist,
  clamScan,
  virusCheck,
  isXml
};
