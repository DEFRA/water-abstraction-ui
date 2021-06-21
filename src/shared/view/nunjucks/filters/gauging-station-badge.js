'use strict';

const badge = {
  no_restriction: { status: 'success', text: 'no restriction' },
  reduce: { status: 'warning', text: 'reduce' },
  warning: { status: 'warning', text: 'warning' },
  stop: { status: 'error', text: 'stop' },
  empty: { status: 'inactive', text: 'n/a' }
};

exports.gaugingStationBadge = (batch, isLarge) => ({
  ...badge[batch.status],
  ...isLarge && { size: 'large' }
});
