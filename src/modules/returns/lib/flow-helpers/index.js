const { get } = require('lodash');
const internalFlows = require('./internal.js');
const externalFlows = require('./external.js');
const permissions = require('../../../../lib/permissions');
const steps = require('./steps');

/**
 * Gets path with return ID query param and admin/ if required depending on scopes
 * @param {String} base path
 * @param {Object} request - HAPI request instance
 * @param {Object} data - return model data
 * @return {String} path
 */
const getPath = (path, request, data) => {
  const returnId = get(data, 'returnId', request.query.returnId);
  const scopedPath = (permissions.isInternal(request) ? `/admin${path}` : path);
  return `${scopedPath}?returnId=${returnId}`;
};

/**
 * Gets the next step in the flow based on the current step and variables
 * @param {String} current - current step in flow
 * @param {Object} request - HAPI request instance
 * @param {Object} data - the return model data
 * @param {String} direction - next|previous
 */

const getNextPath = (current, request, data, direction = 'next') => {
  const flows = permissions.isInternal(request) ? internalFlows : externalFlows;
  const step = flows[direction][current](data);
  return getPath(step, request, data);
};

/**
 * Gets the previous step in the flow based on the current step and variables
 * @param {String} current - current step in flow
 * @param {Object} request - HAPI request instance
 * @param {Object} data - the return model data
 */
const getPreviousPath = (current, request, data) => {
  return getNextPath(current, request, data, 'previous');
};

module.exports = {
  ...steps,
  getPath,
  getNextPath,
  getPreviousPath
};
