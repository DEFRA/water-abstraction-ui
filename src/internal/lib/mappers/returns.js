'use strict';

const dates = require('shared/lib/returns/dates');
const badge = require('shared/lib/returns/badge');
const { getReturnPath } = require('../return-path');

/**
 * Maps return data so that it includes the correct paths
 * and data to render a badge and link
 *
 * @param {Object} ret
 * @param {Object} request
 * @returns {Object}
 */
const mapReturn = (ret, request) => {
  const isPastDueDate = dates.isReturnPastDueDate(ret);
  return {
    ...ret,
    badge: badge.getBadge(ret.status, isPastDueDate),
    ...getReturnPath(ret, request)
  };
};

/**
 * Adds some flags to the returns to help with view rendering
 *
 * Adds an editable flag to each return in list
 * This is based on the status of the return, and whether the user
 * has internal returns role.
 *
 * Adds isPastDueDate flag to help with badge selection.
 *
 * @param {Array} returns - returned from returns service
 * @param {Object} request - HAPI request interface
 * @return {Array} returns with isEditable flag added
 */
const mapReturns = (returns, request) => {
  return returns.map(row => mapReturn(row, request));
};

exports.mapReturn = mapReturn;
exports.mapReturns = mapReturns;
