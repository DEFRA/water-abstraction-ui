'use strict'

const badge = {
  processing: { status: 'inactive', text: 'Building' },
  ready: { status: 'todo', text: 'Ready' },
  sending: { status: 'inactive', text: 'Sending' },
  sent: { status: 'success', text: 'Sent' },
  review: { status: 'todo', text: 'Review' },
  error: { status: 'error', text: 'Error' },
  empty: { status: 'inactive', text: 'Empty' },
  queued: { status: 'warning', text: 'Queued' },
  cancel: { status: 'warning', text: 'Cancelling' }
}

exports.batchBadge = (batch, isLarge) => ({
  ...badge[batch.status],
  ...isLarge && { size: 'large' }
})
