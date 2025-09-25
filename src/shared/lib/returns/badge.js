'use strict'

const DUE_PERIOD_DAYS = 27
const BADGE_STYLES = {
  complete: 'success',
  due: 'todo',
  'not due yet': 'inactive',
  overdue: 'warning',
  received: 'success',
  void: 'inactive'
}

function statusBadge (returnLog) {
  const status = returnLog.status
  const dueDateString = returnLog.due_date || returnLog.dueDate

  const displayStatus = _displayStatus(status, dueDateString)

  return {
    text: displayStatus,
    status: BADGE_STYLES[displayStatus]
  }
}

function _displayStatus (status, dueDateString) {
  // If the return is completed we are required to display it as 'complete'. This also takes priority over the other
  // statues
  if (status === 'completed') {
    return 'complete'
  }

  // For all other statuses except 'due' we can just return the status
  if (status !== 'due') {
    return status
  }

  if (!dueDateString) {
    return 'not due yet'
  }

  // Work out if the return is overdue (status is still 'due' and it is past the due date)
  const dueDate = new Date(dueDateString)
  const today = new Date()

  // The due date held in the record is date-only. If we compared it against 'today' without this step any return due
  // 'today' would be flagged as overdue when it is still due (just!)
  today.setHours(0, 0, 0, 0)

  if (dueDate < today) {
    return 'overdue'
  }

  // A return is considered "due" for 28 days, starting 28 days before the due date
  // Any date before this period should be marked as "not due yet"
  const notDueUntil = new Date(dueDate)

  // Calculate the start of the "due" period, which begins 27 days before the due date
  notDueUntil.setDate(notDueUntil.getDate() - DUE_PERIOD_DAYS)

  // If today is before the "due" period starts, the return is "not due yet"
  if (today < notDueUntil) {
    return 'not due yet'
  }

  return 'due'
}

module.exports = {
  statusBadge
}
