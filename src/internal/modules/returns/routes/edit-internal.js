const { set } = require('lodash');
const controller = require('../controllers/edit');
const constants = require('../../../lib/constants');
const allowedScopes = [constants.scope.returns];
const steps = require('shared/modules/returns/steps');

const services = require('internal/lib/connectors/services');
const FlowStorageAdapter = require('shared/modules/returns/FlowStorageAdapter');
const storageAdapter = new FlowStorageAdapter(services.water.returns);

const { createRoute: sharedCreateRoute } = require('shared/modules/returns/route-helpers');

const createRoute = (...args) => {
  const route = sharedCreateRoute(...args);
  set(route, 'options.auth.scope', allowedScopes);
  set(route, 'options.plugins.flow.adapter', storageAdapter);
  return route;
};

module.exports = [

  createRoute('GET', steps.STEP_DATE_RECEIVED, controller.getDateReceived, {
    pageTitle: 'Abstraction return - enter date received',
    form: require('../forms/return-received').form,
    schema: require('../forms/return-received').schema
  }),

  createRoute('POST', steps.STEP_DATE_RECEIVED, controller.postDateReceived, {
    pageTitle: 'Abstraction return - enter date received',
    form: require('../forms/return-received').form,
    schema: require('../forms/return-received').schema
  }),

  createRoute('GET', steps.STEP_START, controller.getAmounts, {
    pageTitle: 'Abstraction return - are there any abstraction amounts to report?',
    form: require('../forms/amounts').form
  }),

  createRoute('POST', steps.STEP_START, controller.postAmounts, {
    pageTitle: 'Abstraction return - are there any abstraction amounts to report?',
    form: require('../forms/amounts').form
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

  createRoute('GET', steps.STEP_METER_DETAILS_PROVIDED, controller.getMeterDetailsProvided, {
    pageTitle: 'Abstraction return - are meter details provided',
    form: require('../forms/meter-details-provided').form
  }),

  createRoute('POST', steps.STEP_METER_DETAILS_PROVIDED, controller.postMeterDetailsProvided, {
    pageTitle: 'Abstraction return - are meter details provided',
    form: require('../forms/meter-details-provided').form
  }),

  createRoute('GET', steps.STEP_METER_USED, controller.getMeterUsed, {
    pageTitle: 'Abstraction return - was a meter or meters used?',
    form: require('../forms/meter-used').form
  }),

  createRoute('POST', steps.STEP_METER_USED, controller.postMeterUsed, {
    pageTitle: 'Abstraction return - is it a single abstracted amount?',
    form: require('../forms/meter-used').form
  }),

  createRoute('GET', steps.STEP_METER_DETAILS, controller.getMeterDetails, {
    pageTitle: 'Abstraction return - tell us about the meter',
    form: require('../forms/meter-details').form
  }),

  createRoute('POST', steps.STEP_METER_DETAILS, controller.postMeterDetails, {
    pageTitle: 'Abstraction return - tell us about the meter',
    form: require('../forms/meter-details').form
  }),

  createRoute('GET', steps.STEP_METER_READINGS, controller.getMeterReadings, {
    pageTitle: 'Abstraction return - tell us about the meter',
    form: require('../forms/meter-readings').form
  }),

  createRoute('POST', steps.STEP_METER_READINGS, controller.postMeterReadings, {
    pageTitle: 'Abstraction return - tell us about the meter',
    form: require('../forms/meter-readings').form,
    schema: require('../forms/meter-readings').schema
  }),

  createRoute('GET', steps.STEP_SINGLE_TOTAL, controller.getSingleTotal, {
    pageTitle: 'Abstraction return - is it a single abstracted amount?',
    form: require('../forms/single-total').form
  }),

  createRoute('POST', steps.STEP_SINGLE_TOTAL, controller.postSingleTotal, {
    pageTitle: 'Abstraction return - was a meter or meters used?',
    form: require('../forms/single-total').form,
    schema: require('../forms/single-total').schema
  }),

  createRoute('GET', steps.STEP_SINGLE_TOTAL_DATES, controller.getSingleTotalDates, {
    pageTitle: 'Abstraction return - what period was used for this volume?',
    form: require('../forms/single-total-abstraction-period').form
  }),

  createRoute('POST', steps.STEP_SINGLE_TOTAL_DATES, controller.postSingleTotalDates, {
    pageTitle: 'Abstraction return - what period was used for this volume?',
    form: require('../forms/single-total-abstraction-period').form,
    schema: require('../forms/single-total-abstraction-period').schema
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

  createRoute('GET', steps.STEP_CONFIRM, controller.getConfirm, {
    pageTitle: 'Abstraction return - check the information before submitting',
    form: require('../forms/confirm').form,
    showMeta: true
  }),

  createRoute('POST', steps.STEP_CONFIRM, controller.postConfirm, {
    pageTitle: 'Abstraction return - check the information before submitting',
    form: require('../forms/confirm').form,
    showMeta: true,
    submit: true
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
