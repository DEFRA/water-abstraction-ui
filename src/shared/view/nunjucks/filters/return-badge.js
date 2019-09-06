const titleCase = require('title-case');
const moment = require('moment');

const isReturnPastDueDate = returnRow => {
  const dueDate = moment(returnRow.due_date, 'YYYY-MM-DD');
  const today = moment().startOf('day');
  return dueDate.isBefore(today);
};

/**
 * Gets badge object to render for return row
 * @param  {Object}  ret    - return row
 * @return {Object}         - badge text and style
 */
const returnBadge = ret => {
  const isPastDueDate = isReturnPastDueDate(ret);
  const { status } = ret;

  const viewStatus = ((status === 'due') && isPastDueDate) ? 'overdue' : status;

  const styles = {
    overdue: 'error',
    due: 'error',
    void: 'void'
  };

  return {
    text: titleCase(viewStatus),
    status: styles[viewStatus]
  };
};

exports.returnBadge = returnBadge;
