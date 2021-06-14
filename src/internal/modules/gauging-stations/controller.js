const linkageForms = require('./forms');
const { handleFormRequest } = require('shared/lib/form-handler');
// const session = require('./lib/session');

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

  // session.merge(request, key, { data });

  h.redirect(request.path.replace(/\/[^\/]*$/, '/alert-type'));
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

  // session.merge(request, key, { data });

  h.redirect(request.path.replace(/\/[^\/]*$/, '/licence-number'));
};

const getLicenceNumber = (request, h) => {
  const pageTitle = 'Enter the licence number this threshold applies to';

  return h.view('nunjucks/form', {
    ...request.view,
    caption: 'You need to tag and add other licences with this threshold individually',
    pageTitle,
    back: '',
    form: handleFormRequest(request, linkageForms.whichLicence)
  });
};

const postLicenceNumber = (request, h) => {
  const form = handleFormRequest(request, linkageForms.whichLicence);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  // session.merge(request, key, { data });

  h.redirect(request.path.replace(/\/[^\/]*$/, '/condition'));
};

exports.getThresholdAndUnit = getThresholdAndUnit;
exports.postThresholdAndUnit = postThresholdAndUnit;
exports.getAlertType = getAlertType;
exports.postAlertType = postAlertType;
exports.getLicenceNumber = getLicenceNumber;
exports.postLicenceNumber = postLicenceNumber;
