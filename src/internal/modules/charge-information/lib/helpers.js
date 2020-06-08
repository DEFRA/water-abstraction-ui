const { handleRequest, getValues } = require('shared/lib/forms');
const { reducer } = require('./reducer');
const routing = require('./routing');
const sessionForms = require('shared/lib/session-forms');

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

const createPostHandler = (formContainer, actionCreator, getRedirectPath) => async (request, h) => {
  const form = getPostedForm(request, formContainer);
  if (form.isValid) {
    await applyFormResponse(request, form, actionCreator);
    return h.redirect(getRedirectPath(request));
  }
  return h.postRedirectGet(form);
};

const getDefaultView = (request, formContainer) => {
  const { licence } = request.pre;
  const form = sessionForms.get(request, formContainer.form(request));
  return {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    form,
    back: routing.getTasklist(licence)
  };
};

exports.getPostedForm = getPostedForm;
exports.applyFormResponse = applyFormResponse;
exports.createPostHandler = createPostHandler;
exports.getDefaultView = getDefaultView;
