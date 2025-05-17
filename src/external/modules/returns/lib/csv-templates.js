'use strict'

const { last, find, groupBy, lowerCase, get, forEach } = require('lodash')
const helpers = require('@envage/water-abstraction-helpers')
const { getLineLabel } = require('shared/modules/returns/forms/common')
const moment = require('moment')
const util = require('util')
const archiver = require('archiver')
const path = require('path')
const { PassThrough } = require('stream')
const { stringify } = require('csv-stringify')

const csvStringify = util.promisify(stringify)
const { logger } = require('../../../logger')
const files = require('../../../../shared/lib/files')

/**
 * Gets the label for a particular return line in the CSV
 * This is the same as in the service, but also includes the year
 * @param  {Object} line - return line object
 * @return {String} friendly label for the return line in the CSV
 */
const getCSVLineLabel = line => {
  return getLineLabel(line) + ' ' + moment(line.endDate).format('YYYY')
}

/**
 * Gets the current active return cycle
 * @param {String} [refDate] - for unit testing, controls the date for
 *                             the current cycle calculation
 * @return {Object} - cycle description with { startDate, endDate, isSummer }
 */
const getCurrentCycle = (refDate) => {
  const cycles = helpers.returns.date.createReturnCycles(undefined, refDate)
  return last(cycles)
}

/**
 * Initialises a 2D array structure to hold on of the CSVs
 * @param  {String} frequency - day|week|month
 * @param {String} [refDate] - for unit testing, controls the date for
 *                             the current cycle calculation
 * @return {[type]}           [description]
 */
const initialiseCSV = (frequency, startDate, endDate) => {
  // Get date lines for the cycle dates and frequency
  const dateLines = helpers.returns.lines.getRequiredLines(startDate, endDate, frequency)

  // Map to the first column of data in the CSV
  const lineLabels = dateLines.map(line => [getCSVLineLabel(line)])
  return [
    ['Licence number'],
    ['Return reference'],
    ['Site description'],
    ['Purpose'],
    ['Nil return Y/N'],
    ['Did you use a meter Y/N'],
    ['Meter make'],
    ['Meter serial number'],
    ...lineLabels,
    ['Unique return reference']
  ]
}

/**
 * Creates a return column represented as an array for the CSV
 * @param  {Object} ret     - the return loaded from water service
 * @param  {Array} csvLines - array of line descriptions for the entire return cycle
 * @return {Array}          - a column of data to add to the CSV
 */
const createReturnColumn = (ret, csvLines) => {
  const isFinal = get(ret, 'metadata.isFinal', false)
  const requiredLines = helpers.returns.lines.getRequiredLines(ret.startDate, ret.endDate, ret.frequency, isFinal)

  // Iterate over all date rows in the CSV
  const lines = csvLines.map(line => {
    // Does this return include this date line?
    return find(requiredLines, line) ? '' : 'Do not edit'
  })

  return [
    ret.licenceNumber,
    ret.returnRequirement,
    ret.siteDescription,
    ret.purposes.join('\n'),
    '',
    '',
    '',
    '',
    ...lines,
    ret.returnId
  ]
}

/**
 * Adds a column of data to a 2D array
 * Note: the array passed in IS modified
 * @param {Array} data    2D array of data
 * @param {Array} column  column to add
 */
const pushColumn = (data, column) => {
  const columnIndex = data[0].length
  column.forEach((value, rowIndex) => {
    data[rowIndex][columnIndex] = value
  })
  return data
}

/**
 * Given an array of returns loaded from the water service, creates
 * an object of 2D arrays describing a CSV template for each return
 * frequency
 * @param  {Array} returns - loaded from water service
 * @return {Object}
 */
const createCSVData = (returns, refDate) => {
  const allData = []

  // Group returns by return end date and then sub group by frequency
  const nestedGroups = groupBy(returns, ret => ret.dueDate);

  forEach(nestedGroups, (group, key) => {
    nestedGroups[key] = groupBy(group, ret => ret.frequency);
  });

  // Loop though all the groups
  for (const grouped in nestedGroups) {
    // Loop through the different frequencies in each group
    for (const frequency in nestedGroups[grouped]) {
      const data = {}
      const groupedFrequency = nestedGroups[grouped][frequency]

      //sort by return ID
      groupedFrequency.sort((a, b) => {
        return a.returnId.localeCompare(b.returnId);
      });

      //////get earliest start date from returns
      // Initialize a variable to store the earliest date, starting with the first object's start date
      let earliestDate = new Date(groupedFrequency[0].startDate);

      // Iterate through the array of objects
      for (let i = 1; i < groupedFrequency.length; i++) {
        const currentDate = new Date(groupedFrequency[i].startDate);

        // If the current date is earlier than the stored earliest date, update it
        if (currentDate < earliestDate) {
          earliestDate = currentDate;
        }
      }

      // Format the earliest date as a string in the desired format (YYYY-MM-DD)
      const startDate = earliestDate.toISOString().split('T')[0];

      //////get latest end date from returns
      // Initialize a variable to store the latest end date, starting with the first object's end date
      let latestEndDate = new Date(groupedFrequency[0].endDate);

      // Iterate through the array of objects
      for (let i = 1; i < groupedFrequency.length; i++) {
        const currentDate = new Date(groupedFrequency[i].endDate);

        // If the current date is later than the stored latest date, update it
        if (currentDate > latestEndDate) {
          latestEndDate = currentDate;
        }
      }

      // Format the latest end date as a string in the desired format (YYYY-MM-DD)
      const endDate = latestEndDate.toISOString().split('T')[0];

      // Initialise the 2D array
      data[frequency] = initialiseCSV(frequency, startDate, endDate)

      // Get all CSV lines for current cycle/frequency
      const csvLines = helpers.returns.lines.getRequiredLines(startDate, endDate, frequency)

      // For each return of this frequency, generate a column and add to the CSV data
      nestedGroups[grouped][frequency].forEach(ret => {
        const column = createReturnColumn(ret, csvLines)
        pushColumn(data[frequency], column)
      })

      const groups = {[grouped]: data}

      allData.push(groups)
    }
  }

  return allData
}

/**
 * Gets the filename for the CSV based on the company name and return
 * frequency
 * @param  {String} companyName - the current company name
 * @param  {String} frequency   - the return frequency
 * @return {String}             filename, e.g. my-company-daily.csv
 */
const getCSVFilename = (companyName, frequency, dataSet, isMultipleReturns) => {
  const map = {
    day: 'daily',
    week: 'weekly',
    month: 'monthly'
  }
  return lowerCase(`${companyName} ${map[frequency]}`) + ` ${isMultipleReturns ? 'returns' : 'return'}` + ` due ` + lowerCase(`${dataSet}`) + `.csv`
}

const isMultipleReturns = (data, key) => data[key][0].length > 2

/**
 * Adds
 * @param  {Object}  archive - the ZIP archive instance
 * @param  {Object}  data    - CSV data
 * @param  {String}  key     - the return frequency
 * @return {Promise}         resolves when added
 */
const addCSVToArchive = async (archive, companyName, data, key, dataSet) => {
  const str = await csvStringify(data[key])
  const name = getCSVFilename(companyName, key, dataSet, isMultipleReturns(data, key))
  return archive.append(str, { name })
}

/**
 * Adds readme file to ZIP archive
 * @param  {Object}  archive - the ZIP archive instance
 * @return {Promise}         resolves when added
 */
const addReadmeToArchive = async (archive) => {
  const str = await files.readFile(path.join(__dirname, './csv-readme.txt'))
  const name = 'How to do bulk returns.txt'
  return archive.append(str, { name })
}

/**
 * Creates an archiver instance for the zip file, with warning and error
 * handlers registered
 * @return {Object} archiver instance
 */
const createArchive = () => {
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  })

  archive.on('warning', err => {
    if (err.code === 'ENOENT') {
      logger.warn('CSV returns archive error', err)
    } else {
      // throw error
      throw err
    }
  })

  archive.on('error', err => {
    throw err
  })

  return archive
}

/**
 * Builds the ZIP archive containing several CSV templates for users
 * to complete their return data
 * @param  [Array]  allData - array of objects, objects are each set of CSVs
 * @param  {Object}  data        - CSV data object, keys are return frequency
 * @param  {String}  companyName - the current company
 * @param {Object} [archive] - an archiver instance can be passed in for test
 * @return {Promise<Object>} resolves with archive object when finalised
 */
const buildZip = async (allData, companyName, archive) => {
  archive = archive || createArchive()

  // Add a CSV to the archive for each frequency
  for(const dataSets of allData){
    for (const dataSet in dataSets ){
      let data = dataSets[dataSet]

      const tasks = Object.keys(data).map(key => {
        return addCSVToArchive(archive, companyName, data, key, dataSet)
      })

      tasks.push(addReadmeToArchive(archive))
      await Promise.all(tasks)
    }
  }

  archive.finalize()

  // At this stage `archive` is a stream in objectMode. As of 21.0.0 Hapi will not return streams in objectMode so we
  // pipe it though a readable passthrough stream. A better solution would be for `archive` to not be in objectMode in
  // the first place but as far as we can see the archiver library we use does not support this. More info can be found
  // in the 21.0.0 release notes: https://github.com/hapijs/hapi/issues/4386
  return archive.pipe(new PassThrough())
}

exports._getCSVLineLabel = getCSVLineLabel
exports._getCurrentCycle = getCurrentCycle
exports._initialiseCSV = initialiseCSV
exports._createReturnColumn = createReturnColumn
exports._pushColumn = pushColumn
exports._getCSVFilename = getCSVFilename
exports._addCSVToArchive = addCSVToArchive
exports._addReadmeToArchive = addReadmeToArchive
exports._createArchive = createArchive

exports.createCSVData = createCSVData
exports.buildZip = buildZip
