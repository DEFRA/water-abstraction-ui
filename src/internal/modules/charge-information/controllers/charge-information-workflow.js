'use-strict';

const getChargeInformationWorkflow = async (request, h) => {
  const licencesAwaitingReview = request.pre.inProgress.filter(x => x.status === 'draft');
  const licencesWithChangesRequested = request.pre.inProgress.filter(x => x.status === 'changes_requested');
  const view = {
    back: '/manage',
    ...request.view,
    pageTitle: 'Charge information workflow',
    licences: {
      toSetUp: request.pre.toSetUp,
      review: licencesAwaitingReview,
      changeRequest: licencesWithChangesRequested
    },
    licencesCounts: {
      toSetUp: request.pre.toSetUp.length,
      review: licencesAwaitingReview.length,
      changeRequest: licencesWithChangesRequested.length
    }
  };
  return h.view('nunjucks/charge-information/workflow', view);
};

exports.getChargeInformationWorkflow = getChargeInformationWorkflow;
