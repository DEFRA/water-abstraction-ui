const { last, find, groupBy } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');
const { getLineLabel } = require('../lib/return-helpers');
const moment = require('moment');
const snakeCase = require('snake-case');
const util = require('util');
const csvStringify = util.promisify(require('csv-stringify'));
const archiver = require('archiver');
const logger = require('../../../lib/logger');
const readFile = util.promisify(require('fs').readFile);
const path = require('path');

/**
 * Gets the label for a particular return line in the CSV
 * This is the same as in the service, but also includes the year
 * @param  {Object} line - return line object
 * @return {String} friendly label for the return line in the CSV
 */
const getCSVLineLabel = line => {
  return getLineLabel(line) + ' ' + moment(line.endDate).format('YYYY');
};

/**
 * Gets the current active return cycle
 * @return {Object} - cycle description with { startDate, endDate, isSummer }
 */
const getCurrentCycle = () => {
  const cycles = helpers.returns.date.createReturnCycles();
  return last(cycles);
};

/**
 * Initialises a 2D array structure to hold on of the CSVs
 * @param  {String} frequency - day|week|month
 * @return {[type]}           [description]
 */
const initialiseCSV = (frequency) => {
  // Get date range of current active return cycle
  const { startDate, endDate } = getCurrentCycle();

  // Get date lines for the cycle dates and frequency
  const dateLines = helpers.returns.lines.getRequiredLines(startDate, endDate, frequency);

  // Map to the first column of data in the CSV
  const lineLabels = dateLines.map(line => [getCSVLineLabel(line)]);
  return [
    ['Licence number'],
    ['Return reference'],
    ['Nil return Y/N'],
    ['Did you use a meter Y/N'],
    ['Meter make'],
    ['Meter serial number'],
    ...lineLabels,
    ['Unique return reference']
  ];
};

/**
 * Creates a return column represented as an array for the CSV
 * @param  {Object} ret     - the return loaded from water service
 * @param  {Array} csvLines - array of line descriptions for the entire return cycle
 * @return {Array}          - a column of data to add to the CSV
 */
const createReturnColumn = (ret, csvLines) => {
  const requiredLines = helpers.returns.lines.getRequiredLines(ret.startDate, ret.endDate, ret.frequency);

  // Iterate over all date rows in the CSV
  const lines = csvLines.map(line => {
    // Does this return include this date line?
    return find(requiredLines, line) ? '' : 'Do not edit';
  });

  return [
    ret.licenceNumber,
    ret.returnRequirement,
    '',
    '',
    '',
    '',
    ...lines,
    ret.returnId
  ];
};

/**
 * Adds a column of data to a 2D array
 * Note: the array passed in IS modified
 * @param {Array} data    2D array of data
 * @param {Array} column  column to add
 */
const pushColumn = (data, column) => {
  const columnIndex = data[0].length;
  column.forEach((value, rowIndex) => {
    data[rowIndex][columnIndex] = value;
  });
  return data;
};

/**
 * Given an array of returns loaded from the water service, creates
 * an object of 2D arrays describing a CSV template for each return
 * frequency
 * @param  {Array} returns - loaded from water service
 * @return {Object}
 */
const createCSVData = returns => {
  const data = {};

  // Get current return cycle dates
  const { startDate, endDate } = getCurrentCycle();

  // Group returns by frequency
  const grouped = groupBy(returns, ret => ret.frequency);

  for (let frequency in grouped) {
    // Initialise the 2D array
    data[frequency] = initialiseCSV(frequency);

    // Get all CSV lines for current cycle/frequency
    const csvLines = helpers.returns.lines.getRequiredLines(startDate, endDate, frequency);

    // For each return of this frequency, generate a column and add to the CSV data
    grouped[frequency].forEach(ret => {
      const column = createReturnColumn(ret, csvLines);
      pushColumn(data[frequency], column);
    });
  }

  return data;
};

/**
 * Gets the filename for the CSV based on the company name and return
 * frequency
 * @param  {String} companyName - the current company name
 * @param  {String} frequency   - the return frequency
 * @return {String}             filename, e.g. my-company-daily.csv
 */
const getCSVFilename = (companyName, frequency) => {
  const map = {
    day: 'daily',
    week: 'weekly',
    month: 'monthly'
  };
  return snakeCase(`${companyName} ${map[frequency]}`) + '.csv';
};

/**
 * Adds
 * @param  {Object}  archive - the ZIP archive instance
 * @param  {Object}  data    - CSV data
 * @param  {String}  key     - the return frequency
 * @return {Promise}         resolves when added
 */
const addCSVToArchive = async (archive, companyName, data, key) => {
  const str = await csvStringify(data[key]);
  const name = getCSVFilename(companyName, key);
  return archive.append(str, { name });
};

/**
 * Adds readme file to ZIP archive
 * @param  {Object}  archive - the ZIP archive instance
 * @return {Promise}         resolves when added
 */
const addReadmeToArchive = async (archive) => {
  const str = await readFile(path.join(__dirname, './csv-readme.txt'));
  const name = 'readme.txt';
  return archive.append(str, { name });
};

/**
 * Builds the ZIP archive containing several CSV templates for users
 * to complete their return data
 * @param  {Object}  data        - keys are return frequency,
 * @param  {[type]}  companyName [description]
 * @return {Promise}             [description]
 */
const buildZip = async (data, companyName) => {
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  archive.on('warning', err => {
    if (err.code === 'ENOENT') {
      logger.warning('CSV returns archive error', err);
    } else {
      // throw error
      throw err;
    }
  });

  archive.on('error', err => {
    throw err;
  });

  // Add a CSV to the archive for each frequency
  const tasks = Object.keys(data).map(key => {
    return addCSVToArchive(archive, companyName, data, key);
  });
  tasks.push(addReadmeToArchive(archive));
  await Promise.all(tasks);

  archive.finalize();

  return archive;
};

// exports.initialiseCSVs = initialiseCSVs;
exports.createCSVData = createCSVData;
exports.buildZip = buildZip;
