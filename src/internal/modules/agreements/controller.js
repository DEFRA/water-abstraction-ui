'use strict';
const moment = require('moment');
const { partialRight } = require('lodash');
const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates;

const sessionForms = require('shared/lib/session-forms');
const { agreementDescriptions } = require('shared/lib/mappers/agreements');

const { logger } = require('internal/logger');
const helpers = require('./lib/helpers');
const forms = require('shared/lib/forms');

// Services
const water = require('internal/lib/connectors/services').water;

// Forms
const { deleteAgreementForm } = require('./forms/delete-agreement');
const { endAgreementForm, endAgreementFormSchema } = require('./forms/end-agreement');
const { confirmEndAgreementForm } = require('./forms/confirm-end-agreement');
const selectAgreementType = require('./forms/select-agreement-type');
const dateSigned = require('./forms/date-signed');
const checkStartDate = require('./forms/check-start-date');
const confirmForm = require('./forms/confirm');

const { createAddAgreementPostHandler, getAddAgreementSessionData, clearAddAgreementSessionData } = require('./lib/helpers');
const actions = require('./lib/actions');

const getDefaultView = request => ({
  ...request.view,
  caption: `Licence ${request.pre.licence.licenceNumber}`
});

const getDeleteAgreement = (request, h) => {
  const { agreement, licence, document } = request.pre;
  return h.view('nunjucks/agreements/confirm-end-or-delete', {
    ...getDefaultView(request),
    pageTitle: 'You\'re about to delete this agreement',
    verb: 'delete',
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
  const { endDate } = helpers.endAgreementSessionManager(request, agreementId);
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

  const goBack = () => {
    return h.postRedirectGet(form, `/licences/${licenceId}/agreements/${agreementId}/end`);
  };
  if (form.isValid) {
    try {
      await helpers.endAgreementSessionManager(request, agreementId, { endDate: formEndDate });
      return h.redirect(`/licences/${licenceId}/agreements/${agreementId}/end/confirm`);
    } catch (err) {
      return goBack();
    }
  } else {
    return goBack();
  }
};

const getConfirmEndAgreement = async (request, h) => {
  const { agreement, licence } = request.pre;
  const { licenceId, agreementId } = request.params;
  const { endDate } = await helpers.endAgreementSessionManager(request, agreementId);
  return h.view('nunjucks/agreements/confirm-end-or-delete', {
    ...getDefaultView(request),
    pageTitle: 'You\'re about to end this agreement',
    verb: 'end',
    back: `/licences/${licenceId}/agreements/${agreementId}/end`,
    agreement,
    licenceId: licence.id,
    endDate: endDate,
    form: confirmEndAgreementForm(request)
  });
};

const postConfirmEndAgreement = async (request, h) => {
  const { agreementId } = request.params;
  const { document } = request.pre;
  const { endDate } = await helpers.endAgreementSessionManager(request, agreementId);
  try {
    await water.agreements.endAgreement(agreementId, { endDate });
    await helpers.clearEndAgreementSessionData(request, agreementId);
    return h.redirect(`/licences/${document.document_id}#charge`);
  } catch (err) {
    logger.info(`Did not successfully end agreement ${agreementId}`);
  }
};

/**
 * Page 1: Add agreement flow - select agreement type
 */
const getSelectAgreementType = async (request, h) => {
  const { document_id: documentId } = request.pre.document;

  const view = {
    ...getDefaultView(request),
    pageTitle: 'Select agreement',
    form: sessionForms.get(request, selectAgreementType.form(request)),
    back: `/licences/${documentId}#charge`
  };
  return h.view('nunjucks/agreements/form', view);
};

/**
 * Page 2: Add agreement flow - select date signed
 */
const getDateSigned = async (request, h) => {
  const { licence } = request.pre;
  const view = {
    ...getDefaultView(request),
    pageTitle: 'Enter date agreement was signed',
    form: sessionForms.get(request, dateSigned.form(request)),
    back: `/licences/${licence.id}/agreements/select-type`
  };
  return h.view('nunjucks/agreements/form', view);
};

/**
 * Page 3: Add agreement flow - select start date
 */
const getCheckStartDate = async (request, h) => {
  const { licence } = request.pre;
  const { startDate } = getAddAgreementSessionData(request);
  const view = {
    ...getDefaultView(request),
    pageTitle: 'Check agreement start date',
    form: sessionForms.get(request, checkStartDate.form(request)),
    back: `/licences/${licence.id}/agreements/date-signed`,
    startDate,
    isLicenceStartDate: startDate === licence.startDate,
    isFinancialYearStartDate: moment(startDate).format('DD-MM') === '01-04'
  };
  return h.view('nunjucks/agreements/check-start-date', view);
};

/**
 * Page 4: Check your answers
 */
const getCheckAnswers = async (request, h) => {
  const { flowState, licence } = request.pre;

  const basePath = `/licences/${licence.id}/agreements`;

  const view = {
    ...getDefaultView(request),
    pageTitle: 'Check agreement details',
    back: `${basePath}/check-start-date`,
    form: confirmForm.form(request),
    answers: [{
      label: 'Agreement',
      value: agreementDescriptions[flowState.code],
      visuallyHiddenText: 'agreement',
      link: `${basePath}/select-type`
    }, {
      label: 'Date signed',
      value: isoToReadable(flowState.dateSigned),
      visuallyHiddenText: 'date signed',
      link: `${basePath}/date-signed`
    }, {
      label: 'Start date',
      value: isoToReadable(flowState.startDate),
      visuallyHiddenText: 'start date',
      link: `${basePath}/check-start-date`
    }]
  };
  return h.view('nunjucks/agreements/check-answers', view);
};

const postCheckAnswers = async (request, h) => {
  const { licenceId } = request.params;
  const { flowState, document } = request.pre;

  await water.licences.createAgreement(licenceId, flowState);

  clearAddAgreementSessionData(request);

  return h.redirect(`/licences/${document.document_id}#charge`);
};

exports.getDeleteAgreement = getDeleteAgreement;
exports.postDeleteAgreement = postDeleteAgreement;

exports.getEndAgreement = getEndAgreement;
exports.postEndAgreement = postEndAgreement;
exports.getConfirmEndAgreement = getConfirmEndAgreement;
exports.postConfirmEndAgreement = postConfirmEndAgreement;

exports.getSelectAgreementType = getSelectAgreementType;
exports.postSelectAgreementType = partialRight(createAddAgreementPostHandler, selectAgreementType, actions.setAgreementType, `/date-signed`);

exports.getDateSigned = getDateSigned;
exports.postDateSigned = partialRight(createAddAgreementPostHandler, dateSigned, actions.setDateSigned, `/check-start-date`);

exports.getCheckStartDate = getCheckStartDate;
exports.postCheckStartDate = partialRight(createAddAgreementPostHandler, checkStartDate, actions.setStartDate, `/check-answers`);

exports.getCheckAnswers = getCheckAnswers;
exports.postCheckAnswers = postCheckAnswers;
