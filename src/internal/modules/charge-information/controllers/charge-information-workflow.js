'use-strict';

const getChargeInformationWorkflow = async (request, h) => {
  const view = {
    back: '/manage',
    ...request.view,
    pageTitle: 'Charge information workflow',
    licencesCounts: {
      toSetUp: 1,
      review: 2,
      changeRequest: 3
    }
  };
  return h.view('nunjucks/charge-information/workflow', view);
};

exports.getChargeInformationWorkflow = getChargeInformationWorkflow;
