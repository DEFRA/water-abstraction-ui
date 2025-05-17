'use strict'

const { last, find, groupBy, lowerCase, get } = require('lodash')
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

const initialiseCSV = (dateLines) => {
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
const createCSVData = (returns) => {
  const csvDataSets = []

  // Group returns by return end date and then sub group by frequency
  const nestedGroups = groupBy(returns, ret => ret.dueDate)

  for (const [key, group] of Object.entries(nestedGroups)) {
    nestedGroups[key] = groupBy(group, ret => ret.frequency)
  }

  const data = {}

  for (const dueDateKey in nestedGroups) {
    const dueDateGroup = nestedGroups[dueDateKey]

    for (const frequencyKey in dueDateGroup) {
      const frequencyGroup = dueDateGroup[frequencyKey]

      // sort by return ID
      frequencyGroup.sort((a, b) => {
        return a.returnId.localeCompare(b.returnId);
      });

      const { earliestStartDate, latestEndDate } = _earliestAndLatestDates(frequencyGroup)

      // Get date lines between the two dates based on the specified frequency
      const dateLines = helpers.returns.lines.getRequiredLines(earliestStartDate, latestEndDate, frequencyKey)

      // Setup the 2D array
      data[frequencyKey] = initialiseCSV(dateLines)

      for (const returnLog of frequencyGroup) {
        const column = createReturnColumn(returnLog, dateLines)

        pushColumn(data[frequencyKey], column)
      }

      csvDataSets.push({ [dueDateKey]: data })
    }
  }

  return csvDataSets
}

/**
 * Gets the filename for the CSV based on the company name and return
 * frequency
 * @param  {String} companyName - the current company name
 * @param  {String} frequency   - the return frequency
 * @return {String}             filename, e.g. my-company-daily.csv
 */
const getCSVFilename = (companyName, frequency, dueDateAsString, isMultipleReturns) => {
  const map = {
    day: 'daily',
    week: 'weekly',
    month: 'monthly'
  }

  const lowerCaseName = lowerCase(companyName)
  const frequencyText = map[frequency]
  const returnsText = isMultipleReturns ? 'returns' : 'return'
  const dueDateSeparatedWithSpaces = lowerCase(dueDateAsString)

  return `${lowerCaseName} ${frequencyText} ${returnsText} due ${dueDateSeparatedWithSpaces}.csv`
}

const isMultipleReturns = (data, key) => data[key][0].length > 2

/**
 * Adds
 * @param  {Object}  archive - the ZIP archive instance
 * @param  {Object}  data    - CSV data
 * @param  {String}  key     - the return frequency
 * @return {Promise}         resolves when added
 */
const addCSVToArchive = async (archive, companyName, data, key, dueDateDataSetKey) => {
  const str = await csvStringify(data[key])
  const name = getCSVFilename(companyName, key, dueDateDataSetKey, isMultipleReturns(data, key))
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
 * @param  {Object}  csvDataSets - Array of CSV data objects, keys are return frequency
 * @param  {String}  companyName - the current company
 * @param {Object} [archive] - an archiver instance can be passed in for test
 * @return {Promise<Object>} resolves with archive object when finalised
 */
const buildZip = async (csvDataSets, companyName, archive) => {
  archive = archive || createArchive()

  // Add a CSV to the archive for each due date and frequency
  for (const csvDataSet of csvDataSets) {
    for (const dueDateDataSetKey in csvDataSet) {
      const dueDateDataSet = csvDataSet[dueDateDataSetKey]

      const tasks = Object.keys(dueDateDataSet).map(key => {
        return addCSVToArchive(archive, companyName, dueDateDataSet, key, dueDateDataSetKey)
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

function _earliestAndLatestDates (returnLogs) {
  let earliestStartDate = new Date(returnLogs[0].startDate)
  let latestEndDate = new Date(returnLogs[0].endDate)

  for (const returnLog of returnLogs) {
    const startDate = new Date(returnLog.startDate)
    const endDate = new Date(returnLog.endDate)

    if (startDate < earliestStartDate) {
      earliestStartDate = startDate
    }

    if (endDate > latestEndDate) {
      latestEndDate = endDate
    }
  }

  return {
    earliestStartDate: earliestStartDate.toISOString().split('T')[0],
    latestEndDate: latestEndDate.toISOString().split('T')[0]
  }
}

exports._getCSVLineLabel = getCSVLineLabel
exports._initialiseCSV = initialiseCSV
exports._createReturnColumn = createReturnColumn
exports._pushColumn = pushColumn
exports._getCSVFilename = getCSVFilename
exports._addCSVToArchive = addCSVToArchive
exports._addReadmeToArchive = addReadmeToArchive
exports._createArchive = createArchive

exports.createCSVData = createCSVData
exports.buildZip = buildZip
