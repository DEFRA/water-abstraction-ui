'use strict';

const titleCase = require('title-case');

const styles = {
  current: 'completed',
  draft: 'void',
  approved: 'success',
  replaced: 'inactive',
  invalid: 'error',
  review: 'warning'
};

/**
 * Gets badge object to render for charge version status
 */
const chargeVersionBadge = chargeVersion => {
  const { status } = chargeVersion;

  return {
    text: titleCase(status),
    status: styles[status]
  };
};

exports.chargeVersionBadge = chargeVersionBadge;
