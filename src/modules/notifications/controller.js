const { taskConfig } = require('../../lib/connectors/water');
const TaskData = require('./task-data');
const documents = require('../../lib/connectors/crm/documents');
const { forceArray } = require('../../lib/helpers');

// @TODO move this config data to API once schema is settled
const config = [{
  id: 1,
  type: 'notification',
  config: {
    name: 'Hands off flow warning',
    title: 'Send a hands off flow warning',
    permissions: ['admin:defra'],
    formats: ['email', 'letter'],
    variables: [{
      name: 'gauging_station',
      label: 'Gauging station',
      helptext: 'The EA gauging station name',
      default: '',
      widget: 'text',
      validation: null
    }],
    steps: [{
      widgets: [{
        name: 'system_external_id',
        widget: 'textarea',
        label: 'Add licences to this notification.',
        operator: '$in',
        mapper: 'licenceNumbers',
        replay: 'with licence number(s)'
      }]
    }],
    content: {
      default: `Dear ...

We are sending you a message about...
      `
    }
  }
}, {
  id: 2,
  type: 'notification',
  config: {
    name: 'Expiry notice',
    title: 'Send an expiry notification',
    permissions: ['admin:defra'],
    formats: ['email', 'letter'],
    // steps: [{
    //   widgets: [{
    //     name: 'system_external_id',
    //     widget: 'textarea',
    //     label: 'Add licences to this notification.',
    //     operator: '$in',
    //     mapper: 'licenceNumbers',
    //     replay: 'with licence number(s) '
    //   }]
    // }]
    steps: [

      //   {
      //   content: 'Choose an area to send this notification to.',
      //   widgets: [{
      //     name: 'area',
      //     widget: 'dropdown',
      //     label: 'Area',
      //     operator: '=',
      //     lookup: {
      //       filter: { type: 'NALD_REP_UNITS', 'metadata->>ARUT_CODE': 'CAMS' }
      //     }
      //   }, {
      //     name: 'catchment',
      //     widget: 'dropdown',
      //     label: 'Catchment area (optional)',
      //     operator: '=',
      //     lookup: {
      //       filter: { type: 'NALD_REP_UNITS', 'metadata->>ARUT_CODE': 'CAMS' }
      //     }
      //   }]
      // },

      {
        widgets: [{
          name: 'system_external_id',
          widget: 'textarea',
          label: 'Add licences to this notification.',
          operator: '$in',
          mapper: 'licenceNumbers',
          replay: 'with licence number(s)'
        }]
      },
      {
        content: 'Find licences that will expire before:',
        widgets: [{
          name: 'metadata->>Expires',
          widget: 'date',
          mapper: 'date',
          label: '',
          operator: '$lte',
          replay: 'with end date before '
        }]
      }

    ]

  }
}];

const { find } = require('lodash');
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
  const { id } = request.params;

  // Find the requested task
  const task = find(config, (row) => row.id === id);

  const { step: index, data } = request.query;
  let step = task.config.steps[index];

  const taskData = new TaskData(task);
  if (data) {
    taskData.fromJson(data);
  }

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
    formAction: `/admin/notifications/${id}?step=${index}`,
    data: taskData.toJson()
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
  const task = find(config, (row) => row.id === id);

  const { data } = request.payload;

  // Update task data
  const taskData = new TaskData(task);
  taskData.fromJson(data);
  taskData.processRequest(request.payload, step);

  // Redirect to next step
  const nextAction = step < task.config.steps.length - 1
    ? `/admin/notifications/${id}?step=${step + 1}&data=${taskData.toJson()}`
    : `/admin/notifications/${id}/refine?data=${taskData.toJson()}`;

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
  const task = find(config, (row) => row.id === id);

  // Load data from previous step(s)
  const taskData = new TaskData(task);
  taskData.fromJson(request.query.data);

  // Build CRM query filter
  const filter = taskData.getFilter();

  console.log(filter);

  // Get documents data from CRM
  const { error, data, pagination } = await documents.findMany(filter, {}, {
    page: 1,
    perPage: 300
  });

  if (error) {
    return reply(error);
  }

  const view = {
    ...request.view,
    pagination,
    results: data,
    task,
    formAction: `/admin/notifications/${id}/refine?data=${taskData.toJson()}`,
    data: taskData.toJson(),
    query: taskData.exportQuery()
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
  const task = find(config, (row) => row.id === id);

  // Load data from previous step(s)
  const taskData = new TaskData(task);
  taskData.fromJson(request.query.data);

  // Set selected licences
  const licenceNumbers = forceArray(request.payload.system_external_id);
  taskData.addLicenceNumbers(licenceNumbers);

  // Redirect to next step - either confirm or template variable entry
  const redirectUrl = task.variables && task.variables.length
    ? `/admin/notifications/${id}/variables?data=${taskData.toJson()})`
    : `/admin/notifications/${id}/confirm?data=${taskData.toJson()})`;

  return reply.redirect(redirectUrl);
}

async function postConfirm (request, reply) {
  console.log(request.query, request.payload);
}

module.exports = {
  getIndex,
  getStep,
  postStep,
  getRefine,
  postRefine,
  postConfirm
};
