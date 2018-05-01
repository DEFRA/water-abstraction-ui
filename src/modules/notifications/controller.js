const { taskConfig } = require('../../lib/connectors/water');
const TaskData = require('./task-data');
const documents = require('../../lib/connectors/crm/documents');

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
        mapper: 'licenceNumbers'
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
    steps: [{
      widgets: [{
        name: 'system_external_id',
        widget: 'textarea',
        label: 'Add licences to this notification.',
        operator: '$in',
        mapper: 'licenceNumbers'
      }]
    }]

    /*
    steps: [{
      content: 'Choose an area to send this notification to.',
      widgets: [{
        name: 'area',
        widget: 'dropdown',
        label: 'Area',
        operator: '=',
        lookup: {
          filter: { type: 'NALD_REP_UNITS', 'metadata->>ARUT_CODE': 'CAMS' }
        }
      }, {
        name: 'catchment',
        widget: 'dropdown',
        label: 'Catchment area (optional)',
        operator: '=',
        lookup: {
          filter: { type: 'NALD_REP_UNITS', 'metadata->>ARUT_CODE': 'CAMS' }
        }
      }]
    },
    {
      content: 'Find licences that will expire before:',
      widgets: [{
        name: 'expires',
        widget: 'date',
        mapper: 'date',
        label: '',
        operator: '<='
      }]
    }

    ]
    */
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

  const { step: index } = request.query;
  let step = task.config.steps[index];

  const taskData = new TaskData(task);

  if (index > 0) {
    // Load data from previous step(s)
    taskData.fromJson(request.payload.data);
    // Load data from the current form POST request
    taskData.processRequest(request.payload, index - 1);
  }

  const formAction = index < task.config.steps.length - 1
    ? `/admin/notifications/${id}?step=${index + 1}`
    : `/admin/notifications/${id}/refine`;

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
    formAction,
    data: taskData.toJson()
  };
  return reply.view('water/notifications/step', view);
}

/**
 * Refine audience step
 * We retrieve the list of licences matching the search criteria from the
 * previous steps, then allow the user to deselect some if desired
 */
async function postRefine (request, reply) {
  const id = parseInt(request.params.id, 10);

  // Find the requested task
  const task = find(config, (row) => row.id === id);

  const step = task.config.steps.length;

  const taskData = new TaskData(task);

  // Load data from previous step(s) and process current request
  taskData.fromJson(request.payload.data);
  taskData.processRequest(request.payload, step - 1);

  // Build CRM query filter
  const filter = taskData.getFilter();

  // Get documents data from CRM
  const { error, data, pagination } = await documents.findMany(filter, {}, {
    page: 1,
    perPage: 300
  });

  console.log(pagination);

  if (error) {
    return reply(error);
  }

  const formAction = task.config.variables
    ? `/admin/notifications/${id}/variables`
    : `/admin/notifications/${id}/confirm`;

  const view = {
    ...request.view,
    pagination,
    results: data,
    task,
    formAction,
    data: taskData.toJson()
  };

  return reply.view('water/notifications/refine', view);
}

// async function getRefineAudience (request, reply) {
//   const { id } = request.params;
//   const licence_numbers = ['03/28/03/0071', '7/35/03/*G/0025', '18/54/023/S/022'];
//   const filter = `{"system_external_id" : {"$in" : ${JSON.stringify(licence_numbers)}}}`;
//   console.log(filter);
//   const data = await crm.getFilteredLicences(
//     filter, {}, {
//       page: 1,
//       perPage: 300
//     }
//   );
//
//   const view = {
//     ...request.view
//   };
//
//   view.results = JSON.parse(data).data;
//   return reply.view('water/notifications/refine', view);
// }

 async function getVariableData (request, reply) {
   const { id } = request.params;

   // Find the requested task
   const task = find(config, (row) => row.id === id);

   const view = {
     ...request.view,
     taskData: task.config
   };


   return reply.view('water/notifications/data', view);
}

module.exports = {
  getIndex,
  getStep,
  postRefine,
  getVariableData
  // getRefineAudience
};
