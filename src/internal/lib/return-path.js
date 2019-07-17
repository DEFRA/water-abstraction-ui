/**
 * A helper function to calculate the URL path for a given return and user
 * request.
 * A return can either be editable, viewable, or not viewable, depending
 * on various factors.
 */

const {
  isInternalReturns
} = require('./permissions');

const { getReturnId, isCompleted, isAfterSummer2018, isEndDatePast, isVoid } = require('shared/lib/return-path-helpers');

/**
 * Checks if return can be edited by internal returns user
 * @param  {Object} ret     - return row
 * @param  {Object} request - HAPI request
 * @return {Boolean}        whether return can be edited
 */
const isInternalEdit = (ret, request) => {
  return (isAfterSummer2018(ret) && isEndDatePast(ret) && isInternalReturns(request) && !isVoid(ret));
};

/**
 * Gets a link to the edit return page
 * @param  {Object} ret     - return row
 * @param  {Object} request - HAPI request
 * @return {String}         link to edit return page
 */
const getEditButtonPath = (ret, request) => {
  if (isInternalEdit(ret, request)) {
    const returnId = getReturnId(ret);
    return `/return/internal?returnId=${returnId}`;
  };
};

/**
 * Gets a link to view/edit return for internal users
 * @param  {Object} ret     - return row
 * @param  {Object} request - HAPI request
 * @return {Object}         { path, isEdit } contains URL path and isEdit flag
 */
const getReturnPath = (ret, request) => {
  const returnId = getReturnId(ret);
  // Link to completed/void return
  if (isCompleted(ret) || isVoid(ret)) {
    return { path: `/returns/return?id=${returnId}`, isEdit: false };
  }
  // Link to editable return
  if (isAfterSummer2018(ret) && isEndDatePast(ret) && isInternalReturns(request)) {
    return { path: `/return/internal?returnId=${returnId}`, isEdit: true };
  }
};

module.exports = {
  getReturnPath,
  isInternalEdit,
  getEditButtonPath
};
