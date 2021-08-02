'use strict';

const linkageForms = require('./forms');
const formHandler = require('shared/lib/form-handler');
const formHelpers = require('shared/lib/forms');
const session = require('./lib/session');
const helpers = require('./lib/helpers');

const { waterAbstractionAlerts: isWaterAbstractionAlertsEnabled } = require('../../config').featureToggles;

/**
 * Main Gauging station page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.gaugingStationId - gaugingStation guid
 */

const getMonitoringStation = async (request, h) => {
  const { licenceGaugingStations, station } = request.pre;
  const { data } = licenceGaugingStations;

  return h.view('nunjucks/gauging-stations/gauging-station', {
    ...request.view,
    pageTitle: helpers.createTitle(station),
    station,
    isWaterAbstractionAlertsEnabled,
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
      message: 'No licences in the service match the number you entered. Check the licence number and enter again.',
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

  const conditionIsValid = condition.value !== helpers.blankGuid;

  return helpers.redirectTo(request, h, conditionIsValid ? `/check` : '/abstraction-period');
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

  const sessionData = session.merge(request, {
    checkStageReached: true
  });

  const selectedConditionText = helpers.getSelectedConditionText(request);

  const abstractionPeriodData = selectedConditionText && sessionData.startDate ? {
    startDay: sessionData.startDate.value.split('-').reverse()[0],
    startMonth: sessionData.startDate.value.split('-').reverse()[1],
    endDay: sessionData.endDate.value.split('-').reverse()[0],
    endMonth: sessionData.endDate.value.split('-').reverse()[1]
  } : {};

  return h.view('nunjucks/gauging-stations/new-tag-check', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/condition'),
    form: formHandler.handleFormRequest(request, linkageForms.checkYourAnswers),
    sessionData,
    selectedConditionText,
    abstractionPeriodData
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

const removeTagURL = {
  selectCondition: '/remove-tag-multiple',
  selectCompleted: '/remove-tag-complete',
  monitoringStation: '/../'
};

const getRemoveTags = async (request, h) => {
  const pageTitle = 'Which licence do you want to remove a tag from?';
  const caption = await helpers.getCaption(request);
  const { licenceGaugingStations } = request.pre;
  const { data } = licenceGaugingStations;

  /* Used in second step for Multiple tags */
  session.merge(request, {
    selectedLicence: [],
    selectedCondition: [], /* clear selection */
    licenceGaugingStations: data
  });

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    form: formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceView), /* Generates deduplicated list */
    sessionData: session.get(request)
  });
};

const postRemoveTagOrMultiple = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceView); // Back to view

  // Must select one radio
  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  let tagsForLicence = [];
  const selectedLicenceRadio = form.fields.find(field => field.name === 'selectedLicence');
  const sessionData = session.merge(request, {
    selectedLicence: selectedLicenceRadio,
    selectedCondition: [] /* clear selection */
  });

  if (!sessionData.licenceGaugingStations) {
    return helpers.redirectTo(request, h, removeTagURL.monitoringStation);
  }

  if (selectedLicenceRadio) {
    tagsForLicence = sessionData.licenceGaugingStations.filter(item => item.licenceId === selectedLicenceRadio.value);
  }

  const redirectPath = tagsForLicence.length > 1 ? removeTagURL.selectCondition : removeTagURL.selectCompleted;
  return helpers.redirectTo(request, h, redirectPath);
};

const getRemoveTagsConditions = async (request, h) => {
  const pageTitle = 'This licence has more than one tag, select the ones you need to remove';
  const caption = await helpers.getCaption(request);

  const sessionData = session.merge(request, {
    selectedCondition: [] /* clear selection */
  });

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    form: formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceConditions),
    sessionData
  });
};

const postRemoveTagsLicenceSelected = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceConditions);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const formCheckBox = await formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceConditions);
  const selectedCondition = formCheckBox.fields.find(field => field.name === 'selectedCondition');
  session.merge(request, {
    selectedCondition: selectedCondition
  });

  return helpers.redirectTo(request, h, removeTagURL.selectCompleted);
};

const getRemoveTagComplete = async (request, h) => {
  const pageTitle = 'You are about to remove tags from this licence';
  const caption = await helpers.getCaption(request);
  const sessionData = session.get(request);

  const form = await formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceView);
  const selectedLicenceRadio = form.fields.find(field => field.name === 'selectedLicence');
  const dataRadioChoices = selectedLicenceRadio ? selectedLicenceRadio.options.choices : [];
  let selectedMultiple = false;
  let selectedSingle = false;
  let radioChoicesSelected = [];

  if (dataRadioChoices) {
    radioChoicesSelected = sessionData.selectedLicence ? dataRadioChoices.filter(item => item.value === sessionData.selectedLicence.value) : [];
    selectedMultiple = radioChoicesSelected.find(field => field.hint === ' Multiple tags');
    selectedSingle = radioChoicesSelected.find(field => field.hint !== ' Multiple tags');
  }
  if (selectedMultiple) {
    session.merge(request, {
      selected: helpers.selectedConditionWithLinkages(request) ? helpers.selectedConditionWithLinkages(request) : []
    });
  } else {
    /* Handle case when selected item already deleted */
    if (!selectedSingle) {
      return helpers.redirectTo(request, h, removeTagURL.monitoringStation);
    }
    selectedSingle.linkages = [];
    session.merge(request, {
      selected: [selectedSingle]
    });
  }
  return h.view('nunjucks/gauging-stations/remove-tag-complete', {
    ...request.view,
    caption,
    pageTitle,
    form: formHandler.handleFormRequest(request, linkageForms.removeTagConfirm),
    sessionData: session.get(request)
  });
};

const postRemoveTagComplete = async (request, h) => {
  await helpers.handleRemovePost(request);
  return helpers.redirectTo(request, h, '/../');
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
exports.getRemoveTags = getRemoveTags;
exports.getRemoveTagComplete = getRemoveTagComplete;
exports.postRemoveTagOrMultiple = postRemoveTagOrMultiple;
exports.postRemoveTagComplete = postRemoveTagComplete;
exports.postRemoveTagsLicenceSelected = postRemoveTagsLicenceSelected;
exports.getRemoveTagsConditions = getRemoveTagsConditions;
