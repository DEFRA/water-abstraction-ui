/**
 * A helper function to calculate the URL path for a given return and user
 * request.
 * A return can either be editable, viewable, or not viewable, depending
 * on various factors.
 */

const moment = require('moment');

const getEndDate = ret => ret.endDate || ret.end_date;
const isCompleted = ret => (ret.status === 'completed');
const isDue = ret => (ret.status === 'due');
const isVoid = ret => (ret.status === 'void');
const isAfterSummer2018 = ret => moment(getEndDate(ret)).isSameOrAfter('2018-10-31');
const isEndDatePast = ret => moment().isSameOrAfter(getEndDate(ret), 'day');
const isInternal = request => request.permissions.hasPermission('admin.defra');
const isReturnsEditor = request => request.permissions.hasPermission('returns.edit');
const isReturnsSubmitter = request => request.permissions.hasPermission('returns.submit');

const getInternalPath = (ret, request) => {
  // Link to completed/void return
  if (isCompleted(ret) || isVoid(ret)) {
    return { path: `/admin/returns/return?id=${ret.return_id}`, isEdit: false }; ;
  }
  // Link to editable return
  if (isAfterSummer2018(ret) && isEndDatePast(ret) && isReturnsEditor(request)) {
    return { path: `/admin/return/internal?returnId=${ret.return_id}`, isEdit: true };
  }
};

const getExternalPath = (ret, request) => {
  if (isCompleted(ret)) {
    return { path: `/returns/return?id=${ret.return_id}`, isEdit: false }; ;
  }
  if (isDue(ret) && isAfterSummer2018(ret) && isEndDatePast(ret) && isReturnsSubmitter(request)) {
    return { path: `/return/internal?returnId=${ret.return_id}`, isEdit: true };
  }
};

/**
 * Gets the URL path to a given return, depending on the return and user
 * request provided.  Whether the user can view, edit, or do nothing depends
 * on various factors
 * @param  {Object} ret     - return
 * @param  {Object} request - HAPI request
 * @return {Object}         - contains { path, isEdit }
 */
const getReturnPath = (ret, request) => {
  const func = isInternal(request) ? getInternalPath : getExternalPath;
  return func(ret, request);
};

module.exports = {
  getReturnPath
};
