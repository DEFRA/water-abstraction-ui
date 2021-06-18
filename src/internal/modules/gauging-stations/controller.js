const linkageForms = require('./forms');
const { handleFormRequest } = require('shared/lib/form-handler');
const { applyErrors } = require('shared/lib/forms');
const session = require('./lib/session');
const { redirectTo } = require('./lib/helpers');
const Boom = require('@hapi/boom');

const getNewFlow = (request, h) => h.redirect(`${request.path}/../threshold-and-unit`);

const getThresholdAndUnit = (request, h) => {
  const pageTitle = 'What is the licence hands-off flow or level threshold?';

  return h.view('nunjucks/form', {
    ...request.view,
    caption: '',
    pageTitle,
    back: '',
    form: handleFormRequest(request, linkageForms.thresholdAndUnit)
  });
};

const postThresholdAndUnit = (request, h) => {
  const form = handleFormRequest(request, linkageForms.thresholdAndUnit);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  session.merge(request, {
    threshold: form.fields.find(field => field.name === 'threshold'),
    unit: form.fields.find(field => field.name === 'unit')
  });

  return redirectTo(request, h, '/alert-type');
};

const getAlertType = (request, h) => {
  const pageTitle = 'Does the licence holder need to stop or reduce at this threshold?';

  return h.view('nunjucks/form', {
    ...request.view,
    caption: '',
    pageTitle,
    back: '',
    form: handleFormRequest(request, linkageForms.alertType)
  });
};

const postAlertType = (request, h) => {
  const form = handleFormRequest(request, linkageForms.alertType);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  session.merge(request, {
    alertType: form.fields.find(field => field.name === 'alertType'),
    volumeLimited: form.fields.find(field => field.name === 'volumeLimited')
  });

  return redirectTo(request, h, '/licence-number');
};

const getLicenceNumber = (request, h) => {
  const pageTitle = 'Enter the licence number this threshold applies to';

  return h.view('nunjucks/form', {
    ...request.view,
    caption: '',
    pageTitle,
    back: '',
    form: handleFormRequest(request, linkageForms.whichLicence)
  });
};

const postLicenceNumber = (request, h) => {
  const form = handleFormRequest(request, linkageForms.whichLicence);
  const enteredLicenceNumber = form.fields.find(field => field.name === 'licenceNumber');

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }
  if (!request.pre.isLicenceNumberValid) {
    const formWithErrors = applyErrors(form, [{
      name: 'licenceNumber',
      message: 'Licence could not be found',
      summary: 'Licence could not be found'
    }]);
    return h.postRedirectGet(formWithErrors);
  }

  session.merge(request, {
    licenceNumber: enteredLicenceNumber
  });

  return redirectTo(request, h, '/condition');
};

const getCondition = (request, h) => {
  const sessionData = session.get(request);
  const pageTitle = `Select the full condition for licence ${sessionData.licenceNumber.value}`;

  return h.view('nunjucks/form', {
    ...request.view,
    caption: '',
    pageTitle,
    back: '',
    form: handleFormRequest(request, linkageForms.whichCondition)
  });
};

const postCondition = (request, h) => {
  const form = handleFormRequest(request, linkageForms.whichCondition);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const condition = form.fields.find(field => field.name === 'condition');
  session.merge(request, {
    condition
  });

  return redirectTo(request, h, condition.value ? `/check` : '/abstraction-period');
};

const getManuallyDefinedAbstractionPeriod = (request, h) => {
  const pageTitle = 'Enter an abstraction period for licence';

  return h.view('nunjucks/form', {
    ...request.view,
    caption: '',
    pageTitle,
    back: '',
    form: handleFormRequest(request, linkageForms.manuallyDefinedAbstractionPeriod)
  });
};

const postManuallyDefinedAbstractionPeriod = (request, h) => {
  const form = handleFormRequest(request, linkageForms.manuallyDefinedAbstractionPeriod);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  session.merge(request, {
    startDate: form.fields.find(field => field.name === 'startDate'),
    endDate: form.fields.find(field => field.name === 'endDate')
  });

  return redirectTo(request, h, '/check');
};

const getCheckYourAnswers = (request, h) => {
  const pageTitle = 'Check the restriction details';

  return h.view('nunjucks/gauging-stations/new-tag-check', {
    ...request.view,
    caption: '',
    pageTitle,
    back: '',
    form: handleFormRequest(request, linkageForms.checkYourAnswers),
    sessionData: session.get(request)
  });
};

const postCheckYourAnswers = (request, h) => {
  const form = handleFormRequest(request, linkageForms.checkYourAnswers);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  // eslint-disable-next-line no-useless-escape
  return h.redirect(request.path.replace(/\/[^\/]*$/, '/complete'));
};

const getFlowComplete = (request, h) => {
  session.clear(request);
  return h.view('nunjucks/gauging-stations/new-tag-complete', {
    pageTitle: `Licence added to monitoring station`
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
