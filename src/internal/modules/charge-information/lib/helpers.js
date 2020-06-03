const { handleRequest, getValues } = require('shared/lib/forms');
const { reducer } = require('./reducer');

const getPostedForm = (request, formContainer) => {
  const schema = formContainer.schema(request);
  return handleRequest(formContainer.form(request), request, schema);
};

const applyFormResponse = (request, form, actionCreator) => {
  const { licence } = request.pre;
  const action = actionCreator(request, getValues(form));
  const nextState = reducer(request.pre.draftChargeInformation, action);
  return request.server.methods.setDraftChargeInformation(licence.id, nextState);
};

exports.getPostedForm = getPostedForm;
exports.applyFormResponse = applyFormResponse;
