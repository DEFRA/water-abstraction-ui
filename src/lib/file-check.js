const fs = require('fs');
const { pick } = require('lodash');
const fileType = require('file-type');
const readChunk = require('read-chunk');
const util = require('util');
const parseCsv = util.promisify(require('csv-parse'));
const helpers = require('./helpers');
const { logger } = require('@envage/water-abstraction-helpers');
const readFile = util.promisify(fs.readFile);

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
 * Checks whether supplied file path is a valid CSV file
 * @param  {String}  file - path to CSV file
 * @return {Promise<Boolean>}
 */
const isCsv = async file => {
  try {
    const str = await readFile(file);
    await parseCsv(str);
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
  detectFileType,
  _isCsv: isCsv
};
