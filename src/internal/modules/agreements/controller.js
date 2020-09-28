const { deleteAgreementForm } = require('./forms/delete-agreement');
const { endAgreementForm, endAgreementFormSchema } = require('./forms/end-agreement');
const { confirmEndAgreementForm } = require('./forms/confirm-end-agreement');
const water = require('internal/lib/connectors/services').water;
const { logger } = require('internal/logger');
const helpers = require('./lib/helpers');
const forms = require('shared/lib/forms');
const sessionForms = require('shared/lib/session-forms');

const getDefaultView = request => ({
  ...request.view,
  caption: `Licence ${request.pre.licence.licenceNumber}`
});

const getDeleteAgreement = (request, h) => {
  const { agreement, licence, document } = request.pre;
  return h.view('nunjucks/agreements/delete', {
    ...getDefaultView(request),
    pageTitle: 'You\'re about to delete this agreement',
    back: `/licences/${document.document_id}#charge`,
    agreement,
    licenceId: licence.id,
    form: deleteAgreementForm(request)
  });
};

const postDeleteAgreement = async (request, h) => {
  const { agreementId } = request.params;
  const { document } = request.pre;
  try {
    await water.agreements.deleteAgreement(agreementId);
  } catch (err) {
    logger.info(`Did not successfully delete agreement ${agreementId}`);
  }
  return h.redirect(`/licences/${document.document_id}#charge`);
};

const getEndAgreement = async (request, h) => {
  const { agreement, licence, document } = request.pre;
  const { agreementId } = request.params;
  const { endDate } = helpers.sessionManager(request, agreementId);
  return h.view('nunjucks/form', {
    ...getDefaultView(request),
    pageTitle: 'Set agreement end date',
    back: `/licences/${document.document_id}#charge`,
    agreement,
    licenceId: licence.id,
    form: sessionForms.get(request, endAgreementForm(request, endDate))
  });
};

const postEndAgreement = async (request, h) => {
  const { licenceId, agreementId } = request.params;
  const formEndDate = new Date(`${request.payload['endDate-year']}-${request.payload['endDate-month']}-${request.payload['endDate-day']}`);

  const form = await forms.handleRequest(endAgreementForm(request, formEndDate), request, endAgreementFormSchema(request, h));

  function goBack () {
    return h.postRedirectGet(form, `/licences/${licenceId}/agreements/${agreementId}/end`);
  }

  if (form.isValid) {
    try {
      await helpers.sessionManager(request, agreementId, { endDate: formEndDate });
      return h.redirect(`/licences/${licenceId}/agreements/${agreementId}/end/confirm`);
    } catch (err) {
      goBack();
    }
  } else {
    goBack();
  }
};

const getConfirmEndAgreement = async (request, h) => {
  const { agreement, licence, document } = request.pre;
  const { agreementId } = request.params;
  const { endDate } = await helpers.sessionManager(request, agreementId);
  return h.view('nunjucks/agreements/end', {
    ...getDefaultView(request),
    pageTitle: 'You\'re about to end this agreement',
    back: `/licences/${document.document_id}#charge`,
    agreement,
    licenceId: licence.id,
    endDate: endDate,
    form: confirmEndAgreementForm(request)
  });
};

const postConfirmEndAgreement = async (request, h) => {
  const { agreementId } = request.params;
  const { document } = request.pre;
  const { endDate } = await helpers.sessionManager(request, agreementId);
  try {
    await water.agreements.endAgreement(agreementId, { endDate });
    return h.redirect(`/licences/${document.document_id}#charge`);
  } catch (err) {
    logger.info(`Did not successfully end agreement ${agreementId}`);
  }
  return h.redirect(`/licences/${document.document_id}#charge`);
};

exports.getDeleteAgreement = getDeleteAgreement;
exports.postDeleteAgreement = postDeleteAgreement;
exports.getEndAgreement = getEndAgreement;
exports.postEndAgreement = postEndAgreement;
exports.getConfirmEndAgreement = getConfirmEndAgreement;
exports.postConfirmEndAgreement = postConfirmEndAgreement;
