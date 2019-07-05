const FlowStorageAdapter = require('shared/modules/returns/FlowStorageAdapter');
const services = require('external/lib/connectors/services');
const constants = require('external/lib/constants');
const allowedScopes = [constants.scope.licenceHolder, constants.scope.colleagueWithReturns];
const steps = require('./lib/flow-helpers/steps');
const flowHelpers = require('./lib/flow-helpers/external');
const updaters = require('./lib/return-helpers');

const getPreviousPath = step => (request, model) => {
  return `${flowHelpers.previous[step](model)}?returnId=${request.query.returnId}`;
};
const getNextPath = step => (request, model) => {
  return `${flowHelpers.next[step](model)}?returnId=${request.query.returnId}`;
};

module.exports = {
  template: 'nunjucks/returns/form.njk',
  scope: allowedScopes,
  store: new FlowStorageAdapter(services.water.returns),
  states: [{
    route: {
      path: steps.STEP_START,
      options: {
        description: 'Return: was water abstracted?',
        plugins: {
          viewContext: {
            pageTitle: 'Abstraction return - has any water been abstracted?',
            activeNavLink: 'returns',
            showMeta: true
          },
          returns: true
        }
      }
    },
    form: require('./forms/amounts').form,
    update: updaters.applyNilReturn,
    getPreviousPath: () => '/returns',
    getNextPath: getNextPath(steps.STEP_START)
  }, {
    route: {
      path: steps.STEP_METHOD,
      options: {
        description: 'Ask whether meter readings are used',
        plugins: {
          viewContext: {
            pageTitle: 'Abstraction return - how are you reporting your return?',
            activeNavLink: 'returns'
          },
          returns: true
        }
      }
    },
    form: require('./forms/method').form,
    update: updaters.applyMethodExternal,
    getPreviousPath: getPreviousPath(steps.STEP_METHOD),
    getNextPath: getNextPath(steps.STEP_METHOD)
  }, {
    route: {
      path: steps.STEP_UNITS,
      options: {
        description: 'Get units used for this return',
        plugins: {
          viewContext: {
            pageTitle: 'Abstraction return - what is the unit of measurement?',
            activeNavLink: 'returns'
          },
          returns: true
        }
      }
    },
    form: require('./forms/units').form,
    update: updaters.applyMeterUnits,
    getPreviousPath: getPreviousPath(steps.STEP_UNITS),
    getNextPath: getNextPath(steps.STEP_UNITS)
  }, {
    route: {
      path: steps.STEP_METER_RESET,
      options: {
        description: 'Find out if meter has reset or rolled over',
        plugins: {
          viewContext: {
            pageTitle: 'Abstraction return - has your meter reset or rolled over?',
            activeNavLink: 'returns'
          },
          returns: true
        }
      }
    },
    form: require('./forms/meter-reset').form,
    update: updaters.applyMeterReset,
    getPreviousPath: getPreviousPath(steps.STEP_METER_RESET),
    getNextPath: getNextPath(steps.STEP_METER_RESET)
  }, {
    route: {
      path: steps.STEP_QUANTITIES,
      options: {
        description: 'Display quantities form',
        plugins: {
          viewContext: {
            pageTitle: 'Abstraction return - enter amounts',
            activeNavLink: 'returns'
          },
          returns: true
        }
      }
    },
    form: require('./forms/quantities').form,
    schema: require('./forms/quantities').schema,
    update: updaters.applyQuantities,
    getPreviousPath: getPreviousPath(steps.STEP_QUANTITIES),
    getNextPath: getNextPath(steps.STEP_QUANTITIES)

  }]
};
