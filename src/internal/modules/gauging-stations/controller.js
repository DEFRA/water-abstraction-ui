'use strict';

const linkageForms = require('./forms');
const formHandler = require('shared/lib/form-handler');
const formHelpers = require('shared/lib/forms');
const session = require('./lib/session');
const helpers = require('./lib/helpers');

/**
 * Main Gauging station page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.gaugingStationId - gaugingStation guid
 */

const getMonitoringStation = async (request, h) => {
  const { licenceGaugingStations, station } = request.pre;
  let { data } = licenceGaugingStations;

  return h.view('nunjucks/gauging-stations/gauging-station', {
    ...request.view,
    pageTitle: helpers.createTitle(station),
    station,
    licenceGaugingStations: helpers.groupByLicence(data),
    back: '/licences'
  });
};

const getNewFlow = (request, h) => h.redirect(`${request.path}/threshold-and-unit`);

const getThresholdAndUnit = async (request, h) => {
  const caption = await helpers.getCaption(request);
  const pageTitle = 'What is the licence hands-off flow or level threshold?';
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, linkageForms.thresholdAndUnit)
  });
};

const postThresholdAndUnit = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.thresholdAndUnit);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  session.merge(request, {
    threshold: form.fields.find(field => field.name === 'threshold'),
    unit: form.fields.find(field => field.name === 'unit')
  });

  return helpers.redirectTo(request, h, '/alert-type');
};

const getAlertType = async (request, h) => {
  const pageTitle = 'Does the licence holder need to stop or reduce at this threshold?';
  const caption = await helpers.getCaption(request);
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/threshold-and-unit'),
    form: formHandler.handleFormRequest(request, linkageForms.alertType)
  });
};

const postAlertType = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.alertType);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  session.merge(request, {
    alertType: form.fields.find(field => field.name === 'alertType'),
    volumeLimited: form.fields
      .find(field => field.name === 'alertType').options.choices
      .find(field => field.value === 'reduce').fields
      .find(field => field.name === 'volumeLimited')
  });

  return helpers.redirectTo(request, h, '/licence-number');
};

const getLicenceNumber = async (request, h) => {
  const pageTitle = 'Enter the licence number this threshold applies to';
  const caption = await helpers.getCaption(request);
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/alert-type'),
    form: formHandler.handleFormRequest(request, linkageForms.whichLicence)
  });
};

const postLicenceNumber = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.whichLicence);
  const enteredLicenceNumber = form.fields.find(field => field.name === 'licenceNumber');

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }
  if (!request.pre.isLicenceNumberValid) {
    const formWithErrors = formHelpers.applyErrors(form, [{
      name: 'licenceNumber',
      message: 'Licence could not be found',
      summary: 'Licence could not be found'
    }]);
    return h.postRedirectGet(formWithErrors);
  }

  session.merge(request, {
    licenceNumber: enteredLicenceNumber
  });

  return helpers.redirectTo(request, h, '/condition');
};

const getCondition = async (request, h) => {
  const sessionData = session.get(request);
  const pageTitle = `Select the full condition for licence ${sessionData.licenceNumber.value}`;
  const caption = await helpers.getCaption(request);
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/licence-number'),
    form: formHandler.handleFormRequest(request, linkageForms.whichCondition)
  });
};

const postCondition = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.whichCondition);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const condition = form.fields.find(field => field.name === 'condition');
  session.merge(request, {
    condition
  });

  return helpers.redirectTo(request, h, condition.value ? `/check` : '/abstraction-period');
};

const getManuallyDefinedAbstractionPeriod = async (request, h) => {
  const pageTitle = 'Enter an abstraction period for licence';
  const caption = await helpers.getCaption(request);
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/condition'),
    form: formHandler.handleFormRequest(request, linkageForms.manuallyDefinedAbstractionPeriod)
  });
};

const postManuallyDefinedAbstractionPeriod = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.manuallyDefinedAbstractionPeriod);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  session.merge(request, {
    startDate: form.fields.find(field => field.name === 'startDate'),
    endDate: form.fields.find(field => field.name === 'endDate')
  });

  return helpers.redirectTo(request, h, '/check');
};

const getCheckYourAnswers = async (request, h) => {
  const pageTitle = 'Check the restriction details';
  const caption = await helpers.getCaption(request);
  const { path } = request;

  session.merge(request, {
    checkStageReached: true
  });

  const selectedConditionText = helpers.getSelectedConditionText(request);

  return h.view('nunjucks/gauging-stations/new-tag-check', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/condition'),
    form: formHandler.handleFormRequest(request, linkageForms.checkYourAnswers),
    sessionData: session.get(request),
    selectedConditionText
  });
};

const postCheckYourAnswers = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.checkYourAnswers);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  await helpers.handlePost(request);

  // eslint-disable-next-line no-useless-escape
  return h.redirect(request.path.replace(/\/[^\/]*$/, '/complete'));
};

const getFlowComplete = (request, h) => {
  const { licenceNumber } = session.get(request);
  session.clear(request);
  return h.view('nunjucks/gauging-stations/new-tag-complete', {
    pageTitle: `Licence added to monitoring station`,
    back: null,
    licenceRef: licenceNumber.value,
    gaugingStationId: request.params.gaugingStationId
  });
};

exports.getNewFlow = getNewFlow;
exports.getThresholdAndUnit = getThresholdAndUnit;
exports.postThresholdAndUnit = postThresholdAndUnit;
exports.getAlertType = getAlertType;
exports.postAlertType = postAlertType;
exports.getLicenceNumber = getLicenceNumber;
exports.postLicenceNumber = postLicenceNumber;
exports.getCondition = getCondition;
exports.postCondition = postCondition;
exports.getManuallyDefinedAbstractionPeriod = getManuallyDefinedAbstractionPeriod;
exports.postManuallyDefinedAbstractionPeriod = postManuallyDefinedAbstractionPeriod;
exports.getCheckYourAnswers = getCheckYourAnswers;
exports.postCheckYourAnswers = postCheckYourAnswers;
exports.getFlowComplete = getFlowComplete;
exports.getMonitoringStation = getMonitoringStation;
