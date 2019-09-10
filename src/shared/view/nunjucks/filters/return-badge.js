'use strict';

const { isReturnPastDueDate } = require('../../../lib/returns/dates');
const { getBadge } = require('../../../lib/returns/badge');

/**
 * Gets badge object to render for return row
 * @param  {Object}  ret    - return row
 * @return {Object}         - badge text and style
 */
const returnBadge = ret => {
  const isPastDueDate = isReturnPastDueDate(ret);
  const { status } = ret;

  return getBadge(status, isPastDueDate);
};

exports.returnBadge = returnBadge;
