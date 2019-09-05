/**
 * A helper function to calculate the URL path for a given return and user
 * request.
 * A return can either be editable, viewable, or not viewable, depending
 * on various factors.
 */
const { isReturnsUser } = require('./permissions');
const {
  getReturnId,
  isCompleted,
  isDue,
  isAfterSummer2018,
  isEndDatePast
} = require('shared/lib/returns/return-path-helpers');

/**
 * Gets a link to view/edit return for external users
 * @param  {Object} ret     - return row
 * @param  {Object} request - HAPI request
 * @return {Object}         { path, isEdit } contains URL path and isEdit flag
 */
const getReturnPath = (ret, request) => {
  const returnId = getReturnId(ret);
  if (isCompleted(ret)) {
    return { path: `/returns/return?id=${returnId}`, isEdit: false }; ;
  }
  if (isDue(ret) && isAfterSummer2018(ret) && isEndDatePast(ret) && isReturnsUser(request)) {
    return { path: `/return?returnId=${returnId}`, isEdit: true };
  }
};

exports.getReturnPath = getReturnPath;
