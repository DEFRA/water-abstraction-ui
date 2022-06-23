'use strict'

const { titleCase } = require('shared/lib/string-formatter')

const isErrorStatus = status => status === 'error'

/**
 * Maps the displayStatus from the water service to a badge
 * object which will render via Nunjucks
 *
 * @param {String} status
 */
const messageStatusBadgeMapper = status => {
  const text = titleCase(status)
  return isErrorStatus(status) ? { text, status } : { text }
}

const mapMessage = message => ({
  ...message,
  badge: messageStatusBadgeMapper(message.displayStatus)
})

exports.mapMessage = mapMessage
