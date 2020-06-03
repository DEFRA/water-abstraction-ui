const sessionForms = require('shared/lib/session-forms');
const mappers = require('./lib/mappers');

const forms = require('./forms');
const actions = require('./lib/actions');
const routing = require('./lib/routing');
const { getPostedForm, applyFormResponse } = require('./lib/helpers');

/**
 * Displays a task-list page to guide the user through
 * creation of a new charge version
 */
const getTaskList = async (request, h) => {
  const { licence, draftChargeInformation } = request.pre;

  // Map to a task-list data structure
  const taskList = mappers.mapDataToTaskList(draftChargeInformation, licence);

  // Output to view
  return h.view('nunjucks/charge-information/tasklist.njk', {
    back: '/todo',
    pageTitle: 'Set up charge information',
    ...request.view,
    taskList
  });
};

/**
 * Select the reason for the creation of a new charge version
 */
const getReason = async (request, h) => {
  const { licence } = request.pre;

  // Get reason form
  const form = sessionForms.get(request, forms.reason.form(request));

  // Output to view
  return h.view('nunjucks/charge-information/form.njk', {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    pageTitle: 'Select reason for new charge information',
    form,
    back: routing.getTasklist(licence)
  });
};

const postReason = async (request, h) => {
  const form = getPostedForm(request, forms.reason);
  if (form.isValid) {
    await applyFormResponse(request, form, actions.setChangeReasonAction);
    return h.redirect(routing.getTasklist(request.pre.licence));
  }
  return h.postRedirectGet(form);
};

/**
 * Select the start date for the new charge version
 */
const getStartDate = async (request, h) => {
  const { licence } = request.pre;

  // Get reason form
  const form = sessionForms.get(request, forms.startDate.form(request));

  // Output to view
  return h.view('nunjucks/charge-information/form.njk', {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    pageTitle: 'Set charge start date',
    form,
    back: routing.getTasklist(licence)
  });
};

const postStartDate = async (request, h) => {
  const form = getPostedForm(request, forms.startDate);
  if (form.isValid) {
    await applyFormResponse(request, form, actions.setStartDate);
    return h.redirect(routing.getTasklist(request.pre.licence));
  }
  return h.postRedirectGet(form);
};

exports.getTasklist = getTaskList;
exports.getReason = getReason;
exports.postReason = postReason;
exports.getStartDate = getStartDate;
exports.postStartDate = postStartDate;
