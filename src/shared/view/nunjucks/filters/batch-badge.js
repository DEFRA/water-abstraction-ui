'use strict';

const badge = {
  processing: { status: 'inactive', text: 'Building' },
  ready: { status: 'todo', text: 'Ready' },
  sent: { status: 'success', text: 'Sent' },
  review: { status: 'todo', text: 'Review' },
  error: { status: 'error', text: 'Error' },
  empty: { status: 'error', text: 'Error' }
};

exports.batchBadge = (batch, isLarge) => ({
  ...badge[batch.status],
  ...isLarge && { size: 'large' }
});
