'use strict'

const { date } = require('./date')

/**
 * Format a date range
 * @param  {Object} dateRange
 * @param  {String} dateRange.startDate
 * @param  {String} dateRange.endDate
 */
const dateRange = ({ startDate, endDate }) => [
  date(startDate),
  'to',
  date(endDate)
].join(' ')

exports.dateRange = dateRange
