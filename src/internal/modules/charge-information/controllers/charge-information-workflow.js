'use-strict';

const getChargeInformationWorkflow = async (request, h) => {
  return h.view('nunjucks/charge-information/workflow', request.view);
};

exports.getChargeInformationWorkflow = getChargeInformationWorkflow;
