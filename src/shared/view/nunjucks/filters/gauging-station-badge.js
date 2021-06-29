'use strict';

const badge = {
  resume: { status: 'success', text: 'Resume' },
  reduce: { status: 'warning', text: 'Reduce' },
  warning: { status: 'warning', text: 'Warning' },
  stop: { status: 'error', text: 'Stop' },
  empty: { status: 'void', text: 'None' }
};

exports.gaugingStationBadge = (batch, isLarge) => ({
  ...badge[batch.status],
  ...isLarge && { size: 'large' }
});
