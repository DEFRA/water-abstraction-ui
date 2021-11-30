'use-strict';
const { chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const { hasScope } = require('internal/lib/permissions');
const { deleteChargeInfo } = require('../forms');
const services = require('../../../lib/connectors/services');
const { sortBy } = require('lodash');

const getChargeInformationWorkflow = async (request, h) => {
  const toSetUp = request.pre.chargeInformationWorkflows;
  const review = request.pre.chargeInformationWorkflowsReview;
  const changeRequest = request.pre.chargeInformationWorkflowsChangeRequest;

  const view = {
    back: '/manage',
    ...request.view,
    pageTitle: 'Charge information workflow',
    licences: {
      changeRequest,
      toSetUp,
      review: {
        data: [...sortBy(review.data, ['chargeVersion.dateRange.startDate'])],
        pagination: review.pagination
      }
    },
    licencesCounts: {
      toSetUp: toSetUp.pagination.totalRows,
      review: review.pagination.totalRows,
      changeRequest: changeRequest.pagination.totalRows
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
