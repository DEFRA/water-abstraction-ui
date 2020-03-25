'use strict';

const badge = {
  processing: { status: 'warning', text: 'Building' },
  ready: { status: 'success', text: 'Ready' },
  sent: { text: 'Sent' },
  review: { status: 'warning', text: 'Review' },
  error: { status: 'error', text: 'Error' }
};

exports.batchBadge = (batch, isLarge) => ({
  ...badge[batch.status],
  ...isLarge && { size: 'large' }
});
