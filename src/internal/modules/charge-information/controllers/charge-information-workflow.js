'use-strict';
const { chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const { hasScope } = require('internal/lib/permissions');
const { deleteChargeInfo } = require('../forms');
const services = require('../../../lib/connectors/services');
const { sortBy } = require('lodash');

const getChargeVersionWorkflowsByStatus = (workflows, status) =>
  workflows.filter(workflow => workflow.status === status);

const getChargeVersionWorkflowsForTabs = workflows => ({
  toSetUp: getChargeVersionWorkflowsByStatus(workflows, 'to_setup'),
  review: getChargeVersionWorkflowsByStatus(workflows, 'review'),
  changeRequest: getChargeVersionWorkflowsByStatus(workflows, 'changes_requested')
});

const getChargeInformationWorkflow = async (request, h) => {
  let { toSetUp, pagination } = getChargeVersionWorkflowsForTabs(request.pre.chargeInformationWorkflows);
  const { review } = getChargeVersionWorkflowsForTabs(request.pre.chargeInformationWorkflowsReview);
  const { changeRequest } = getChargeVersionWorkflowsForTabs(request.pre.chargeInformationWorkflowsChangeRequest);

  if (!pagination) {
    pagination = {
      perPage: 10,
      page: 1
    };
  }

  const view = {
    back: '/manage',
    ...request.view,
    pageTitle: 'Charge information workflow',
    licences: { changeRequest, toSetUp, review: sortBy(review, ['chargeVersion.dateRange.startDate']) },
    licencesCounts: {
      pagination: pagination,
      toSetUp: toSetUp.length,
      review: review.length,
      changeRequest: changeRequest.length
    },
    isReviewer: hasScope(request, chargeVersionWorkflowReviewer)
  };
  return h.view('nunjucks/charge-information/workflow', view);
};

const getRemoveChargeInformationWorkflow = (request, h) => {
  const { licence, licenceHolderRole } = request.pre.chargeInformationWorkflow;
  return h.view('nunjucks/charge-information/remove-workflow', {
    ...request.view,
    pageTitle: 'You\'re about to remove this licence from the workflow',
    back: '/charge-information-workflow',
    licence,
    licenceHolderRole,
    form: deleteChargeInfo.form(request, false)
  });
};

const postRemoveChargeInformationWorkflow = async (request, h) => {
  const { chargeVersionWorkflowId } = request.params;
  await services.water.chargeVersionWorkflows.deleteChargeVersionWorkflow(chargeVersionWorkflowId);
  return h.redirect('/charge-information-workflow');
};

exports.getChargeInformationWorkflow = getChargeInformationWorkflow;
exports.getRemoveChargeInformationWorkflow = getRemoveChargeInformationWorkflow;
exports.postRemoveChargeInformationWorkflow = postRemoveChargeInformationWorkflow;
