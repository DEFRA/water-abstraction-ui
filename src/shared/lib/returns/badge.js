'use strict'

const DUE_PERIOD_DAYS = 27
const BADGE_STYLES = {
  complete: 'success',
  due: 'todo',
  'not due yet': 'inactive',
  open: 'todo',
  overdue: 'warning',
  received: 'success',
  void: 'inactive'
}

function statusBadge (returnLog) {
  const status = returnLog.status
  const dueDateString = returnLog.due_date || returnLog.dueDate
  const endDateString = returnLog.end_date || returnLog.endDate

  const displayStatus = _displayStatus(status, endDateString, dueDateString)

  return {
    text: displayStatus,
    status: BADGE_STYLES[displayStatus]
  }
}

function _displayStatus (status, endDateString, dueDateString) {
  // If the return is completed we are required to display it as 'complete'. This also takes priority over the other
  // statues
  if (status === 'completed') {
    return 'complete'
  }

  // For all other statuses (received and void) except 'due' we can just return the status
  if (status !== 'due') {
    return status
  }

  const todaysDate = new Date()
  todaysDate.setHours(0, 0, 0, 0)

  const endDate = new Date(endDateString)

  // If the return log has not yet ended then it is not yet due for submissions
  if (todaysDate <= endDate) {
    return 'not due yet'
  }

  // If we are here, the return log has a status of 'due' and is past its end date. If a due date has not been set then
  // it is simply 'open' for return submissions
  if (!dueDateString) {
    return 'open'
  }

  // If we are here, the return log has a due date. If todays date is greater than that, then we are overdue
  const dueDate = new Date(dueDateString)

  if (dueDate < todaysDate) {
    return 'overdue'
  }

  // Calculate the start of the 'due period'. A return is considered "due" when in its 'due period'. This starts 28 days
  // before its due date (inclusive hence we use 27 in the calculation).
  const duePeriodStartDate = new Date(dueDate)

  duePeriodStartDate.setDate(duePeriodStartDate.getDate() - DUE_PERIOD_DAYS)

  if (todaysDate >= duePeriodStartDate) {
    return 'due'
  }

  // If we get here then we the return log has a status of 'due', its end date is in the past, and its due date is more
  // than 28 days in the future. Once dynamic due dates becomes the norm, we are unlikely to get to this point.
  return 'open'
}

module.exports = {
  statusBadge
}
