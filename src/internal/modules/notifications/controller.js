'use strict';

const { Promise } = require('bluebird');
const { sumBy, parseInt } = require('lodash');
const TaskData = require('./lib/task-data');
const { getContext } = require('./lib/context');
const { forceArray } = require('shared/lib/array-helpers');
const services = require('../../lib/connectors/services');
const { licenceValidator } = require('./lib/licence-validator');
const { checkAccess } = require('./lib/permission');

const createErrorList = error =>
  error.map(err => ({ text: err.message, href: `#${err.field}` }));

const getParsedParams = request => ({
  id: parseInt(request.params.id),
  step: parseInt(request.query.step),
  start: parseInt(request.query.start)
});

const getTaskConfigById = async request => {
  const { id } = getParsedParams(request);
  const { data, error } = await services.water.taskConfigs.findOne(id);

  if (error) {
    throw error;
  }

  return data;
};

/**
  * Helper handler for start flow
  * @param {Object} request - HAPI HTTP request
  * @param {Number} request.params.id - the task ID
  * @param {Number} request.query.step - the step in the process - default to 0
  * @param {Object} h - HAPI response toolkit
  * @param {Object} task - task config data from water service
  */
async function getStartFlow (request, h, task) {
  const context = await getContext(request.defra.userId);
  const state = null;
  const taskData = new TaskData(task, state, context);
  request.yar.set('notificationsFlow', taskData.getData());

  // Redirect if contact details not set
  if (!context.contactDetails.name) {
    const url = encodeURIComponent(`/notifications/${request.params.id}?start=1`);
    return h.redirect(`/notifications/contact?redirect=${url}`);
  }
  return renderStep(request, h, taskData, 0);
}

/**
 * View a step in the flow
 * @param {Object} request - HAPI HTTP request
 * @param {Number} request.params.id - the task ID
 * @param {Number} request.query.step - the step in the process - default to 0
 * @param {Object} h - HAPI response toolkit
 */
async function getStep (request, h) {
  // Get selected task config
  const { step, start } = getParsedParams(request);
  const task = await getTaskConfigById(request);

  checkAccess(request, task);

  if (start) {
    return getStartFlow(request, h, task);
  }

  const context = await getContext(request.defra.userId);
  const state = request.yar.get('notificationsFlow');

  const taskData = new TaskData(task, state, context);
  return renderStep(request, h, taskData, step);
}

/**
 * Generic renderStep handler - used by both the GET handler, and the POST
 * handler if there is a validation issue
 * @param {Object} request - HAPI request interface
 * @param {Object} h - HAPI response toolkit
 * @param {Object} taskData - the current task state object
 * @param {Number} index - the step to show (index of the steps array)
 */
async function renderStep (request, h, taskData, index) {
  const { task } = taskData;

  const step = task.config.steps[index];

  // Populate lookup data
  step.widgets = await Promise.map(step.widgets, async (widget) => {
    if (widget.lookup) {
      const { data, error } = await services.water.lookups.findMany(widget.lookup.filter);
      if (error) {
        throw error;
      }
      widget.data = data;
    }
    return widget;
  });

  const view = {
    ...request.view,
    step,
    formAction: `/notifications/${task.task_config_id}?step=${index}`,
    pageTitle: task.config.title
  };
  return h.view('nunjucks/notifications/step', view);
}

/**
 * POST handler for saving step
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.step - step in the task
 * @param {String} request.payload.data - JSON payload storing flow state
 */
async function postStep (request, h) {
  // Get selected task config
  const { id, step } = getParsedParams(request);
  const task = await getTaskConfigById(request);

  checkAccess(request, task);

  // Update task data
  const taskData = new TaskData(task, request.yar.get('notificationsFlow'));
  const { error } = taskData.processRequest(request.payload, step);

  // Update
  request.yar.set('notificationsFlow', taskData.getData());

  // If validation error, re-render current step
  if (error) {
    request.view.error = error;
    request.view.errorList = createErrorList(error);
    request.view.errorField = error.reduce((acc, err) => {
      acc[err.field] = { text: err.message };
      return acc;
    }, {});
    return renderStep(request, h, taskData, step);
  }

  // Redirect to next step
  const nextAction = step < task.config.steps.length - 1
    ? `/notifications/${id}?step=${step + 1}`
    : `/notifications/${id}/refine`;

  return h.redirect(nextAction);
}

/**
 * View refine page
 * We retrieve the list of licences matching the search criteria from the
 * previous steps, then allow the user to deselect some if desired
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.data - JSON data for current task state
 */
async function getRefine (request, h) {
  // Get selected task config
  const { id } = getParsedParams(request);
  const task = await getTaskConfigById(request);

  checkAccess(request, task);

  // Load data from previous step(s)
  const taskData = new TaskData(task, request.yar.get('notificationsFlow'));

  // Build CRM query filter
  const filter = taskData.getFilter();

  // Get documents data from CRM
  const { error, data, pagination } = await services.crm.documents.findMany(filter,
    { system_external_id: +1 },
    { page: 1, perPage: 300 }
  );

  if (error) {
    return error;
  }

  const query = taskData.exportQuery();

  // Format replay data
  const replay = [];
  task.config.steps.forEach(step => {
    step.widgets.forEach(widget => {
      if (widget.replay && query[widget.name]) {
        replay.push({ label: widget.replay, value: query[widget.name] });
      }
    });
  });

  const licenceErrors = licenceValidator(filter, data);

  const view = {
    ...request.view,
    pagination,
    results: data,
    formAction: `/notifications/${id}/refine`,
    back: `/notifications/${id}/step?step=${task.config.steps.length - 1}`,
    query,
    replay,
    pageTitle: task.config.title,
    errors: {
      [request.query.flash]: true
    },
    licenceErrors,
    errorList: createErrorList(licenceErrors)
  };

  return h.view('nunjucks/notifications/refine', view);
}

/**
 * Post handler for refine audience step
 * add the array of selected licences to the task data and redirect
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.data - JSON task state
 */
async function postRefine (request, h) {
  // Get selected task config
  const id = parseInt(request.params.id, 10);
  const task = await getTaskConfigById(request);

  checkAccess(request, task);

  // Load data from previous step(s)
  const taskData = new TaskData(task, request.yar.get('notificationsFlow'));

  // Set selected licences
  const licenceNumbers = forceArray(request.payload.system_external_id);
  taskData.setLicenceNumbers(licenceNumbers);

  // Update session
  request.yar.set('notificationsFlow', taskData.getData());

  // If no licences selected, display same screen again with error message
  if (licenceNumbers.length === 0) {
    return h.redirect(`/notifications/${id}/refine?flash=noLicencesSelected`);
  }

  // Redirect to next step - either confirm or template variable entry
  const redirectUrl = task.config.variables && task.config.variables.length
    ? `/notifications/${id}/data`
    : `/notifications/${id}/preview`;

  return h.redirect(redirectUrl);
}

/**
 * Render variable handler - used by both the GET handler, and the POST
 * handler if there is a validation issue
 * @param {Object} request - HAPI request interface
 * @param {Object} h - HAPI response toolkit
 * @param {Object} taskData - the current task state object
 */
async function renderVariableData (request, h, taskData) {
  const { task } = taskData;
  checkAccess(request, task);

  const view = {
    ...request.view,
    task,
    values: taskData.data.params,
    formAction: `/notifications/${task.task_config_id}/data`,
    pageTitle: task.config.title,
    back: `/notifications/${task.task_config_id}/refine`
  };

  return h.view('nunjucks/notifications/data', view);
}

/**
 * Allow user to input custom variables/params which are passed through to
 * the message template
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.data - JSON for task state
 */
async function getVariableData (request, h) {
  // Find the requested task
  const task = await getTaskConfigById(request);

  checkAccess(request, task);

  // Load data from previous step(s)
  const taskData = new TaskData(task, request.yar.get('notificationsFlow'));

  return renderVariableData(request, h, taskData);
}

/**
 * Post handler for custom template variable data
 * @param {String} request.params.id - task config ID
 * @param {String} request.payload.data - current task state JSON
 * @param {Object} request.payload - contains additional custom fields as defined in task config
 */
async function postVariableData (request, h) {
  const id = parseInt(request.params.id, 10);

  // Find the requested task
  const task = await getTaskConfigById(request);

  checkAccess(request, task);

  // Load data from previous step(s)
  const taskData = new TaskData(task, request.yar.get('notificationsFlow'));
  const { error } = taskData.processParameterRequest(request.payload);

  // Save to session
  request.yar.set('notificationsFlow', taskData.getData());

  // Re-render variable screen
  if (error) {
    request.view.error = error;
    request.view.errorList = createErrorList(error);
    return renderVariableData(request, h, taskData);
  }

  // Redirect to next step
  return h.redirect(`/notifications/${id}/preview`);
}

/**
 * Counts licences in preview data
 * @param {Array} previewData
 * @return {Number} number of licences
 */
const countPreviewLicences = previewData =>
  sumBy(previewData, row => row.contact.licences.length);

/**
 * A shared function for use by getPreview / postSend
 * @param {Number} id - the task config ID
 * @param {Object} data - state from session store
 * @param {String} sender - the sender email address if sending, if omitted previews
 * @return {Object} view context data
 */
async function getSendViewContext (id, data, sender) {
  // Find the requested task
  const { data: task, error: taskConfigError } = await services.water.taskConfigs.findOne(id);
  if (taskConfigError) {
    throw taskConfigError;
  }

  // Load data from previous step(s)
  const taskData = new TaskData(task, data);

  // Generate preview
  const licenceNumbers = taskData.getLicenceNumbers();
  const params = taskData.getParameters();
  const { error, data: previewData } = await services.water.notifications.sendNotification(id, licenceNumbers, params, sender);

  // Get summary data
  const summary = {
    messageCount: previewData.length,
    licenceCount: countPreviewLicences(previewData),
    sampleMessage: previewData[0].output
  };

  const sentTitle = 'Notification sent';
  const previewTitle = `Check and confirm your ${task.config.name.toLowerCase()}`;

  return {
    task,
    summary,
    error,
    data: taskData.toJson(),
    formAction: `/notifications/${id}/send`,
    pageTitle: sender ? sentTitle : previewTitle,
    back: `/notification/${id}/${task.config.variables ? 'data' : 'refine'}`
  };
}

/**
 * Preview message for sending
 * Sends request to water service as if message is being sent
 * Displays licence/contact count and sample message
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.data - JSON encoded string of task state
 */
async function getPreview (request, h) {
  const { id } = request.params;

  const view = {
    ...request.view,
    ...await getSendViewContext(id, request.yar.get('notificationsFlow'))
  };

  checkAccess(request, view.task);

  return h.view('nunjucks/notifications/preview', view);
}

/**
 * Send message
 * Sends request to water service
 * Displays licence/contact count and sample message
 * @param {String} request.params.id - task config ID
 * @param {String} request.payload.data - JSON encoded string of task state
 */
async function postSend (request, h) {
  const { id } = request.params;

  // Get email address of current user
  const { userName } = request.defra;

  const view = {
    ...request.view,
    ...await getSendViewContext(id, request.yar.get('notificationsFlow'), userName)
  };

  checkAccess(request, view.task);

  // Flow is completed - delete state in session store
  request.yar.clear('notificationsFlow');

  return h.view('nunjucks/notifications/sent', view);
}

exports.getStep = getStep;
exports.postStep = postStep;

exports.getRefine = getRefine;
exports.postRefine = postRefine;

exports.getVariableData = getVariableData;
exports.postVariableData = postVariableData;

exports.getPreview = getPreview;

exports.postSend = postSend;
