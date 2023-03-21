const fs = require('fs')
const { pick } = require('lodash')
const util = require('util')
const { parse } = require('csv-parse')

const parseCsv = util.promisify(parse)
const childProcessHelpers = require('./child-process-helpers')
const files = require('./files')

/**
 * Throws an error if the specified file does not exist
 * @param  {String} file - path to file
 */
const throwIfFileDoesNotExist = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`File not found: ${file}`)
  }
  return true
}

const isInfectedFile = (err) => {
  return err.code === 1
}

const createLoggerError = (err) => {
  const error = new Error('Virus checker found infected file')
  error.params = pick(err, ['code', 'cmd', 'stdout'])
  return error
}

/**
 * Runs the Clam Scan virus check on a particular file
 * @param  {String}  file - the file to scan
 * @return {Promise}      - resolves with true if file clean, false if infected
 */
const clamScan = async (file) => {
  try {
    await childProcessHelpers.exec(`clamdscan ${file}`)
    return { isClean: true }
  } catch (err) {
    if (isInfectedFile(err)) {
      return { isClean: false, err: createLoggerError(err) }
    }
    throw err
  }
}

/**
 * Runs clamscan virus check on specified file
 * Throws error if virus present
 * @param  {String} file - path to file
 * @return {Boolean}     - true if successful
 */
const virusCheck = async (file) => {
  throwIfFileDoesNotExist(file)
  return clamScan(file)
}

/**
 * Checks whether supplied file path is a valid CSV file
 * @param  {String}  file - path to CSV file
 * @return {Promise<Boolean>}
 */
const isCsv = async file => {
  try {
    const str = await files.readFile(file)
    await parseCsv(str)
    return true
  } catch (err) {
    return false
  }
}

const detectFileType = async (file) => {
  throwIfFileDoesNotExist(file)
  const { fileTypeFromFile } = await import('file-type')

  // Detect file types supported by file-type module
  const result = await fileTypeFromFile(file)
  if (result) {
    return result.ext
  }

  // Detect CSV file
  const isCsvResult = await isCsv(file)
  if (isCsvResult) {
    return 'csv'
  }
}

module.exports = {
  throwIfFileDoesNotExist,
  clamScan,
  virusCheck,
  detectFileType,
  _isCsv: isCsv
}
