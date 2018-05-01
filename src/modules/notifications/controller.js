const { taskConfig } = require('../../lib/connectors/water');
const crm = require('../../lib/connectors/crm/documents');


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
    }],
    content: {
      default: `Dear ...

We are sending you a message about...
      `
    }
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

  // Populate lookup data
  const { step: index } = request.query;
  let step = task.config.steps[index];

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

  // Determine form action
  const formAction = index < (request.query.step - 1)
    ? `/admin/notifications/${id}?step=${index + 1}`
    : `/admin/notifications/complete/${id}`;

  const view = {
    ...request.view,
    task,
    step,
    formAction
  };
  return reply.view('water/notifications/step', view);
}

async function getRefineAudience (request, reply) {
  const { id } = request.params;
  const licence_numbers=["03/28/03/0071","7/35/03/*G/0025","18/54/023/S/022"]
  const filter=`{"system_external_id" : {"$in" : ${JSON.stringify(licence_numbers)}}}`
  console.log(filter)
  const data=await crm.getFilteredLicences(
    filter,
    {},{
    page: 1,
    perPage: 300
    }
  )


  const view = {
    ...request.view,
  };

  view.results=JSON.parse(data).data
  return reply.view('water/notifications/refine', view);
}


module.exports = {
  getIndex,
  getStep,
  getRefineAudience
};
