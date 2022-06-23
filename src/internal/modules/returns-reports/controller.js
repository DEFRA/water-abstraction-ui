'use strict'

const moment = require('moment')
const { sortBy } = require('lodash')
const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates

const services = require('../../lib/connectors/services')
const csv = require('internal/lib/csv-download')
const mappers = require('./lib/mappers')

const getStartDate = returnCycle => returnCycle.dateRange.startDate

const isPastCycle = returnCycle =>
  moment(returnCycle.dateRange.endDate).isSameOrBefore(Date.now(), 'day')

/**
 * Gets a list of returns cycles that are active within the service
 */
const getReturnCycles = async (request, h) => {
  // Get data from water service
  const { data } = await services.water.returnCycles.getReport()

  // Sort by date descending
  const [currentCycle, ...cycles] = sortBy(data, getStartDate)
    .filter(isPastCycle)
    .reverse()
    .map(mappers.mapCycle)

  return h.view('nunjucks/returns-reports/index', {
    ...request.view,
    currentCycle,
    cycles
  })
}

/**
 * Confirm page for CSV download
 */
const getConfirmDownload = async (request, h) => {
  const { returnCycleId } = request.params

  // Get data from water service
  const returnCycle = await services.water.returnCycles.getReturnCycleById(returnCycleId)

  // Format period
  const period = [returnCycle.dateRange.startDate, returnCycle.dateRange.endDate]
    .map(isoToReadable)
    .join(' to ')

  return h.view('nunjucks/returns-reports/confirm-download', {
    ...request.view,
    pageTitle: `Download returns report for ${period}`,
    link: `/returns-reports/download/${returnCycle.id}`,
    back: '/returns-reports'
  })
}

/**
 * Download CSV report for given return cycle
 */
const getDownloadReport = async (request, h) => {
  const { returnCycleId } = request.params

  // Get return cycle and returns data
  const [returnCycle, { data }] = await Promise.all([
    services.water.returnCycles.getReturnCycleById(returnCycleId),
    services.water.returnCycles.getReturnCycleReturns(returnCycleId)
  ])

  // Map filename and return CSV
  const fileName = mappers.mapFileName(returnCycle)
  return csv.csvDownload(h, data.map(mappers.mapReturn), fileName)
}

module.exports = {
  getReturnCycles,
  getConfirmDownload,
  getDownloadReport
}
