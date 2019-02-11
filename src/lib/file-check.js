const fs = require('fs');
const helpers = require('./helpers');

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

/**
 * Runs the Clam Scan virus check on a particular file
 * @param  {String}  file - the file to scan
 * @return {Promise}      - resolves if file clean
 */
const clamScan = async (file) => {
  return helpers.exec(`clamdscan ${file} --no-summary`);
};

/**
 * Runs clamscan virus check on specified file
 * Throws error if virus present
 * @param  {String} file - path to file
 * @return {Boolean}     - true if successful
 */
const virusCheck = async (file) => {
  throwIfFileDoesNotExist(file);
  await clamScan(file);
  return true;
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
