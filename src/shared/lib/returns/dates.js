'use strict'

const moment = require('moment')

const getDueDate = ret => ret.due_date || ret.dueDate

const isReturnPastDueDate = returnRow => {
  const dueDate = moment(getDueDate(returnRow), 'YYYY-MM-DD')
  const today = moment().startOf('day')
  return dueDate.isBefore(today)
}

exports.isReturnPastDueDate = isReturnPastDueDate
