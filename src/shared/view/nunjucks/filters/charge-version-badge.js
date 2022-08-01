'use strict'

const { titleCase } = require('shared/lib/string-formatter')

const styles = {
  draft: 'void',
  approved: 'success',
  replaced: 'inactive',
  superseded: 'inactive',
  invalid: 'error',
  review: 'warning',
  'change request': 'todo',
  to_setup: 'todo'
}

//  Map the backend statuses to the desired front-end labels from acceptance criteria.
//  Statuses are: 'Draft', 'Review', 'Change Request', 'Approved', 'Replaced' - We will also keep invalid to accomodate errors and edge cases. TT 2020-08-28
const displayedTextTransformer = {
  current: 'approved',
  draft: 'draft',
  approved: 'approved',
  replaced: 'replaced',
  superseded: 'replaced',
  invalid: 'invalid',
  review: 'review',
  changes_requested: 'change request',
  to_setup: 'to set up'
}

/**
 * Gets badge object to render for charge version status
 */
const chargeVersionBadge = (chargeVersion, isLarge = false) => {
  const { status } = chargeVersion
  const displayedLabel = displayedTextTransformer[status.toLowerCase()]
  return {
    text: titleCase(displayedLabel),
    status: styles[displayedLabel],
    ...isLarge && { size: 'large' }
  }
}

exports.chargeVersionBadge = chargeVersionBadge
