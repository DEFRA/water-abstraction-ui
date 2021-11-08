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
  const { toSetUp } = getChargeVersionWorkflowsForTabs(request.pre.chargeInformationWorkflows.data);
  const { paget1, paget2, paget3, perPage } = request.query;
  const { review } = getChargeVersionWorkflowsForTabs(request.pre.chargeInformationWorkflowsReview);
  const { changeRequest } = getChargeVersionWorkflowsForTabs(request.pre.chargeInformationWorkflowsChangeRequest);
  const paginationt1 = request.pre.chargeInformationWorkflows.pagination ? request.pre.chargeInformationWorkflows.pagination : { perPage, pageCount: 1, totalRows: perPage };
  const paginationt2 = request.pre.chargeInformationWorkflowsReview.pagination ? request.pre.chargeInformationWorkflowsReview.pagination : { perPage, pageCount: 1, totalRows: perPage };
  const paginationt3 = request.pre.chargeInformationWorkflowsChangeRequest.pagination ? request.pre.chargeInformationWorkflowsChangeRequest.pagination : { perPage, pageCount: 1, totalRows: perPage };

  paginationt1.page = paget1 || 1;
  paginationt2.page = paget2 || 1;
  paginationt3.page = paget3 || 1;

  paginationt2.totalRows = review.length;
  paginationt3.totalRows = changeRequest.length;

  const view = {
    back: '/manage',
    ...request.view,
    pageTitle: 'Charge information workflow',
    licences: { changeRequest, toSetUp, review: sortBy(review, ['chargeVersion.dateRange.startDate']) },
    licencesCounts: {
      paginationt1,
      paginationt2,
      paginationt3,
      toSetUp: paginationt1.totalRows,
      review: paginationt2.totalRows,
      changeRequest: paginationt3.totalRows
    },
    isReviewer: hasScope(request, chargeVersionWorkflowReviewer)
  };

  view.paginationUrl = `/charge-information-workflow`;
  view.paginationReviewUrl = `/charge-information-workflow`;
  view.paginationChangeRequestUrl = `/charge-information-workflow`;

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
