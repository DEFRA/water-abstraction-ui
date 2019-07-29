const { set } = require('lodash');

const services = require('external/lib/connectors/services');
const FlowStorageAdapter = require('shared/modules/returns/FlowStorageAdapter');
const constants = require('external/lib/constants');
const allowedScopes = [constants.scope.licenceHolder, constants.scope.colleagueWithReturns];
const steps = require('shared/modules/returns/steps');
const storageAdapter = new FlowStorageAdapter(services.water.returns);

const controller = require('../controllers/edit');

const { createRoute: sharedCreateRoute } = require('shared/modules/returns/route-helpers');

const createRoute = (...args) => {
  const route = sharedCreateRoute(...args);
  set(route, 'options.auth.scope', allowedScopes);
  set(route, 'options.plugins.flow.adapter', storageAdapter);
  return route;
};

module.exports = [

  createRoute('GET', steps.STEP_START, controller.getAmounts, {
    pageTitle: 'Abstraction return - has any water been abstracted?',
    form: require('../forms/amounts').form,
    showMeta: true
  }),

  createRoute('POST', steps.STEP_START, controller.postAmounts, {
    pageTitle: 'Abstraction return - has any water been abstracted?',
    form: require('../forms/amounts').form,
    showMeta: true
  }),

  createRoute('GET', steps.STEP_METHOD, controller.getMethod, {
    pageTitle: 'Abstraction return - how are you reporting your return?',
    form: require('../forms/method').form
  }),

  createRoute('POST', steps.STEP_METHOD, controller.postMethod, {
    pageTitle: 'Abstraction return - how are you reporting your return?',
    form: require('../forms/method').form
  }),

  createRoute('GET', steps.STEP_UNITS, controller.getUnits, {
    pageTitle: 'Abstraction return - what is the unit of measurement?',
    form: require('../forms/units').form
  }),

  createRoute('POST', steps.STEP_UNITS, controller.postUnits, {
    pageTitle: 'Abstraction return - what is the unit of measurement?',
    form: require('../forms/units').form
  }),

  createRoute('GET', steps.STEP_QUANTITIES, controller.getQuantities, {
    pageTitle: 'Abstraction return - enter amounts',
    form: require('../forms/quantities').form
  }),

  createRoute('POST', steps.STEP_QUANTITIES, controller.postQuantities, {
    pageTitle: 'Abstraction return - enter amounts',
    form: require('../forms/quantities').form,
    schema: require('../forms/quantities').schema
  }),

  createRoute('GET', steps.STEP_METER_DETAILS, controller.getMeterDetails, {
    pageTitle: 'Abstraction return - tell us about your meter',
    form: require('../forms/meter-details').form
  }),

  createRoute('POST', steps.STEP_METER_DETAILS, controller.postMeterDetails, {
    pageTitle: 'Abstraction return - tell us about your meter',
    form: require('../forms/meter-details').form,
    schema: require('../forms/meter-details').schema
  }),

  createRoute('GET', steps.STEP_CONFIRM, controller.getConfirm, {
    pageTitle: 'Abstraction return - check the information before submitting',
    form: require('../forms/confirm').form,
    showMeta: true
  }),

  createRoute('POST', steps.STEP_CONFIRM, controller.postConfirm, {
    pageTitle: 'Abstraction return - check the information before submitting',
    form: require('../forms/confirm').form,
    schema: require('../forms/confirm').schema,
    showMeta: true,
    submit: true
  }),

  createRoute('GET', steps.STEP_METER_RESET, controller.getMeterReset, {
    pageTitle: 'Abstraction return - has your meter reset or rolled over?',
    form: require('../forms/meter-reset').form
  }),

  createRoute('POST', steps.STEP_METER_RESET, controller.postMeterReset, {
    pageTitle: 'Abstraction return - has your meter reset or rolled over?',
    form: require('../forms/meter-reset').form,
    schema: require('../forms/meter-reset').schema
  }),

  createRoute('GET', steps.STEP_METER_READINGS, controller.getMeterReadings, {
    pageTitle: 'Abstraction return - enter meter readings',
    form: require('../forms/meter-readings').form
  }),

  createRoute('POST', steps.STEP_METER_READINGS, controller.postMeterReadings, {
    pageTitle: 'Abstraction return - enter meter readings',
    form: require('../forms/meter-readings').form,
    schema: require('../forms/meter-readings').schema
  }),

  {
    method: 'GET',
    path: '/return/submitted',
    handler: controller.getSubmitted,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Confirmation screen for nil return',
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  }

];
