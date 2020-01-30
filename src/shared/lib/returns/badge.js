'use strict';

const titleCase = require('title-case');

/**
 * Gets badge object to render for return row
 * @param  {String}  status    - return status
 * @param  {Boolean} isPastDue - whether return is past due
 * @return {Object}            - badge text and style
 */
const getBadge = (status, isPastDueDate) => {
  let viewStatus = ((status === 'due') && isPastDueDate) ? 'overdue' : status;

  viewStatus = (viewStatus === 'completed') ? 'complete' : viewStatus;

  const styles = {
    overdue: 'error',
    due: 'error',
    void: 'dark'
  };

  return {
    text: titleCase(viewStatus),
    status: styles[viewStatus]
  };
};

exports.getBadge = getBadge;
