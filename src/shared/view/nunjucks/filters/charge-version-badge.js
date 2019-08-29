const titleCase = require('title-case');

/**
 * Gets badge object to render for charge version status
 */
const chargeVersionBadge = chargeVersion => {
  const { status } = chargeVersion;

  const styles = {
    current: 'completed',
    draft: 'void'
  };

  return {
    text: titleCase(status),
    status: styles[status]
  };
};

exports.chargeVersionBadge = chargeVersionBadge;
