const { taskConfig } = require('../../lib/connectors/water');
const TaskData = require('./task-data');
const documents = require('../../lib/connectors/crm/documents');
const { forceArray } = require('../../lib/helpers');
const { sendNotification } = require('../../lib/connectors/water');

const { lookup } = require('../../lib/connectors/water');
const { Promise } = require('bluebird');

/**
 * Renders page with list of notifications that can be selected
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function getIndex (request, reply) {
  const filter = {
    type: 'notification'
  };
  const { data: tasks, error } = await taskConfig.findMany(filter);

  if (error) {
    return reply(error);
  }

  return reply.view('water/notifications/index', { tasks, ...request.view });
}

/**
 * View a step in the flow
 * @param {Object} request - HAPI HTTP request
 * @param {Number} request.params.id - the task ID
 * @param {Number} request.query.step - the step in the process - default to 0
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function getStep (request, reply) {
  // Get selected task config
  const id = parseInt(request.params.id, 10);
  const start = parseInt(request.query.start, 10); // Are we starting the flow?
  const step = parseInt(request.query.step, 10);

  const { data: task, error: taskConfigError } = await taskConfig.findOne(id);
  if (taskConfigError) {
    return reply(taskConfigError);
  }

  if (start) {
    request.sessionStore.delete('notificationsFlow');
  }

  // Update task data
  const taskData = new TaskData(task, request.sessionStore.get('notificationsFlow'));

  return renderStep(request, reply, taskData, step);
}

/**
 * Generic renderStep handler - used by both the GET handler, and the POST
 * handler if there is a validation issue
 * @param {Object} request - HAPI request interface
 * @param {Object} reply - HAPI reply interface
 * @param {Object} taskData - the current task state object
 * @param {Number} index - the step to show (index of the steps array)
 */
async function renderStep (request, reply, taskData, index) {
  const { task } = taskData;

  const step = task.config.steps[index];

  // Populate lookup data
  step.widgets = await Promise.map(step.widgets, async (widget) => {
    if (widget.lookup) {
      const { data, error } = await lookup.findMany(widget.lookup.filter);
      if (error) {
        throw error;
      }
      widget.data = data;
    }
    return widget;
  });

  const view = {
    ...request.view,
    task,
    index,
    step,
    formAction: `/admin/notifications/${task.task_config_id}?step=${index}`,
    pageTitle: task.config.title
  };
  return reply.view('water/notifications/step', view);
}

/**
 * POST handler for saving step
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.step - step in the task
 * @param {String} request.payload.data - JSON payload storing flow state
 */
async function postStep (request, reply) {
  // Get selected task config
  const id = parseInt(request.params.id, 10);
  const step = parseInt(request.query.step, 10);
  const { data: task, error: taskConfigError } = await taskConfig.findOne(id);
  if (taskConfigError) {
    return reply(taskConfigError);
  }

  // Update task data
  const taskData = new TaskData(task, request.sessionStore.get('notificationsFlow'));
  // taskData.fromJson(data);
  const { error } = taskData.processRequest(request.payload, step);

  // Update
  request.sessionStore.set('notificationsFlow', taskData.getData());

  // If validation error, re-render current step
  if (error) {
    request.view.error = error;
    return renderStep(request, reply, taskData, step);
  }

  // Redirect to next step
  const nextAction = step < task.config.steps.length - 1
    ? `/admin/notifications/${id}?step=${step + 1}`
    : `/admin/notifications/${id}/refine`;

  return reply.redirect(nextAction);
}

/**
 * View refine page
 * We retrieve the list of licences matching the search criteria from the
 * previous steps, then allow the user to deselect some if desired
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.data - JSON data for current task state
 */
async function getRefine (request, reply) {
  // Get selected task config
  const id = parseInt(request.params.id, 10);
  const { data: task, error: taskConfigError } = await taskConfig.findOne(id);
  if (taskConfigError) {
    return reply(taskConfigError);
  }

  // Load data from previous step(s)
  const taskData = new TaskData(task, request.sessionStore.get('notificationsFlow'));
  // taskData.fromJson(request.query.data);

  // Build CRM query filter
  const filter = taskData.getFilter();

  // Get documents data from CRM
  const { error, data, pagination } = await documents.findMany(filter, {
    system_external_id: +1
  }, {
    page: 1,
    perPage: 300
  });

  if (error) {
    return reply(error);
  }

  const query = taskData.exportQuery();

  // Format replay data
  const replay = [];
  task.config.steps.forEach(step => {
    step.widgets.forEach(widget => {
      if (widget.replay && query[widget.name]) {
        replay.push({
          label: widget.replay,
          value: query[widget.name]
        });
      }
    });
  });

  const view = {
    ...request.view,
    pagination,
    results: data,
    task,
    formAction: `/admin/notifications/${id}/refine`,
    back: `/admin/notifications/${id}/step?step=${task.config.steps.length - 1}`,
    query,
    replay,
    pageTitle: task.config.title,
    errors: {
      [request.query.flash]: true
    }
  };

  return reply.view('water/notifications/refine', view);
}

/**
 * Post handler for refine audience step
 * add the array of selected licences to the task data and redirect
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.data - JSON task state
 */
async function postRefine (request, reply) {
  // Get selected task config
  const id = parseInt(request.params.id, 10);
  const { data: task, error: taskConfigError } = await taskConfig.findOne(id);
  if (taskConfigError) {
    return reply(taskConfigError);
  }

  // Load data from previous step(s)
  const taskData = new TaskData(task, request.sessionStore.get('notificationsFlow'));

  // Set selected licences
  const licenceNumbers = forceArray(request.payload.system_external_id);
  taskData.setLicenceNumbers(licenceNumbers);

  // Update session
  request.sessionStore.set('notificationsFlow', taskData.getData());

  // If no licences selected, display same screen again with error message
  if (licenceNumbers.length === 0) {
    return reply.redirect(`/admin/notifications/${id}/refine?flash=noLicencesSelected`);
  }

  // Redirect to next step - either confirm or template variable entry
  const redirectUrl = task.config.variables && task.config.variables.length
    ? `/admin/notifications/${id}/data`
    : `/admin/notifications/${id}/preview`;

  return reply.redirect(redirectUrl);
}

/**
 * Render variable handler - used by both the GET handler, and the POST
 * handler if there is a validation issue
 * @param {Object} request - HAPI request interface
 * @param {Object} reply - HAPI reply interface
 * @param {Object} taskData - the current task state object
 */
async function renderVariableData (request, reply, taskData) {
  const { task } = taskData;

  const view = {
    ...request.view,
    task,
    values: taskData.data.params,
    formAction: `/admin/notifications/${task.task_config_id}/data`,
    pageTitle: task.config.title,
    back: `/admin/notifications/${task.task_config_id}/refine`
  };

  return reply.view('water/notifications/data', view);
}

/**
 * Allow user to input custom variables/params which are passed through to
 * the message template
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.data - JSON for task state
 */
async function getVariableData (request, reply) {
  const { id } = request.params;

  // Find the requested task
  const { data: task, error: taskConfigError } = await taskConfig.findOne(id);
  if (taskConfigError) {
    return reply(taskConfigError);
  }

  // Load data from previous step(s)
  const taskData = new TaskData(task, request.sessionStore.get('notificationsFlow'));

  return renderVariableData(request, reply, taskData);
}

/**
 * Post handler for custom template variable data
 * @param {String} request.params.id - task config ID
 * @param {String} request.payload.data - current task state JSON
 * @param {Object} request.payload - contains additional custom fields as defined in task config
 */
async function postVariableData (request, reply) {
  const id = parseInt(request.params.id, 10);

  // Find the requested task
  const { data: task, error: taskConfigError } = await taskConfig.findOne(id);
  if (taskConfigError) {
    return reply(taskConfigError);
  }

  // Load data from previous step(s)
  const taskData = new TaskData(task, request.sessionStore.get('notificationsFlow'));
  const { error } = taskData.processParameterRequest(request.payload);

  // Save to session
  request.sessionStore.set('notificationsFlow', taskData.getData());

  // Re-render variable screen
  if (error) {
    request.view.error = error;
    return renderVariableData(request, reply, taskData);
  } else {
    // Redirect to next step
    return reply.redirect(`/admin/notifications/${id}/preview`);
  }
}

/**
 * Counts licences in preview data
 * @param {Array} previewData
 * @return {Number} number of licences
 */
function countPreviewLicences (previewData) {
  return previewData.reduce((acc, row) => {
    return acc + row.contact.licences.length;
  }, 0);
};

/**
 * A shared function for use by getPreview / postSend
 * @param {Number} id - the task config ID
 * @param {Object} data - state from session store
 * @return {Object} view context data
 */
async function getSendViewContext (id, data, sender) {
  // Find the requested task
  const { data: task, error: taskConfigError } = await taskConfig.findOne(id);
  if (taskConfigError) {
    throw taskConfigError;
  }

  // Load data from previous step(s)
  const taskData = new TaskData(task, data);

  // Generate preview
  const licenceNumbers = taskData.getLicenceNumbers();
  const params = taskData.getParameters();
  const { error, data: previewData } = await sendNotification(id, licenceNumbers, params, sender);

  // Get summary data
  const summary = {
    messageCount: previewData.length,
    licenceCount: countPreviewLicences(previewData),
    sampleMessage: previewData[0].output
  };

  return {
    task,
    summary,
    error,
    data: taskData.toJson(),
    formAction: `/admin/notifications/${id}/send`,
    pageTitle: `Check and confirm your ${task.config.name.toLowerCase()}`,
    back: `/admin/notification/${id}/${task.config.variables ? 'data' : 'refine'}`
  };
}

/**
 * Preview message for sending
 * Sends request to water service as if message is being sent
 * Displays licence/contact count and sample message
 * @param {String} request.params.id - task config ID
 * @param {String} request.query.data - JSON encoded string of task state
 */
async function getPreview (request, reply) {
  const { id } = request.params;

  const view = {
    ...request.view,
    ...await getSendViewContext(id, request.sessionStore.get('notificationsFlow'))
  };
  return reply.view('water/notifications/preview', view);
}

/**
 * Send message
 * Sends request to water service
 * Displays licence/contact count and sample message
 * @param {String} request.params.id - task config ID
 * @param {String} request.payload.data - JSON encoded string of task state
 */
async function postSend (request, reply) {
  const { id } = request.params;

  // Get email address of current user
  const { username } = request.auth.credentials;

  const view = {
    ...request.view,
    ...await getSendViewContext(id, request.sessionStore.get('notificationsFlow'), username)
  };

  // Flow is completed - delete state in session store
  request.sessionStore.delete('notificationsFlow');

  return reply.view('water/notifications/sent', view);
}

module.exports = {
  getIndex,
  getStep,
  postStep,
  getRefine,
  postRefine,
  getVariableData,
  postVariableData,
  getPreview,
  postSend
};
