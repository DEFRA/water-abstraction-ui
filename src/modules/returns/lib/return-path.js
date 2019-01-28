/**
 * A helper function to calculate the URL path for a given return and user
 * request.
 * A return can either be editable, viewable, or not viewable, depending
 * on various factors.
 */

const moment = require('moment');
const { hasPermission } = require('../../../lib/permissions');

const getEndDate = ret => ret.endDate || ret.end_date;
const isCompleted = ret => (ret.status === 'completed');
const isDue = ret => (ret.status === 'due');
const isVoid = ret => (ret.status === 'void');
const isAfterSummer2018 = ret => moment(getEndDate(ret)).isSameOrAfter('2018-10-31', 'day');
const isEndDatePast = ret => moment().isSameOrAfter(getEndDate(ret), 'day');
const isInternal = permissions => hasPermission('admin.defra', permissions);
const isReturnsEditor = permissions => hasPermission('returns.edit', permissions);
const isReturnsSubmitter = permissions => hasPermission('returns.submit', permissions);

/**
 * Gets a link to view/edit return for internal users
 * @param  {Object} ret     - return row
 * @param  {Object} request - HAPI request
 * @return {Object}         { path, isEdit } contains URL path and isEdit flag
 */
const getInternalPath = (ret, permissions) => {
  // Link to completed/void return
  if (isCompleted(ret) || isVoid(ret)) {
    return { path: `/admin/returns/return?id=${ret.return_id}`, isEdit: false }; ;
  }
  // Link to editable return
  if (isAfterSummer2018(ret) && isEndDatePast(ret) && isReturnsEditor(permissions)) {
    return { path: `/admin/return/internal?returnId=${ret.return_id}`, isEdit: true };
  }
};

/**
 * Gets a link to view/edit return for external users
 * @param  {Object} ret     - return row
 * @param  {Object} request - HAPI request
 * @return {Object}         { path, isEdit } contains URL path and isEdit flag
 */
const getExternalPath = (ret, permissions) => {
  if (isCompleted(ret)) {
    return { path: `/returns/return?id=${ret.return_id}`, isEdit: false }; ;
  }
  if (isDue(ret) && isAfterSummer2018(ret) && isEndDatePast(ret) && isReturnsSubmitter(permissions)) {
    return { path: `/return?returnId=${ret.return_id}`, isEdit: true };
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
  const { permissions } = request;
  const func = isInternal(permissions) ? getInternalPath : getExternalPath;
  return func(ret, permissions);
};

module.exports = {
  getReturnPath
};
