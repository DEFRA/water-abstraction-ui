const { STATUS_IN_PROGRESS, STATUS_IN_REVIEW } = require('./statuses');
const { isARApprover } = require('../../../lib/permissions');

/**
 * Calculates the permissions the current user has on the current document
 * @param {Object} request - the HAPI request instance
 * @param {Object} finalState - the state of the abstraction reform document
 * @return {Object} permissions
 */
const getPermissions = (request, finalState) => {
  const { status } = finalState;
  const approve = isARApprover(request);
  const inProgress = status === STATUS_IN_PROGRESS;
  const inReview = status === STATUS_IN_REVIEW;
  const canEdit = (inReview && approve) || inProgress;
  return {
    canEdit,
    canSubmit: canEdit,
    canApprove: approve
  };
};

module.exports = {
  getPermissions
};
