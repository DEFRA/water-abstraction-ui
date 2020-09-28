'use strict';

const moment = require('moment');
const { partialRight } = require('lodash');
const sessionForms = require('shared/lib/session-forms');
const { agreementDescriptions } = require('shared/lib/mappers/agreements');

const { logger } = require('internal/logger');

// Services
const water = require('internal/lib/connectors/services').water;

// Forms
const { deleteAgreementForm } = require('./forms/delete-agreement');
const selectAgreementType = require('./forms/select-agreement-type');
const dateSigned = require('./forms/date-signed');
const checkStartDate = require('./forms/check-start-date');
const confirmForm = require('./forms/confirm');

const { createPostHandler, getSessionData, clearSessionData } = require('./lib/helpers');
const actions = require('./lib/actions');

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

/**
 * Page 1: Add agreement flow - select agreement type
 */
const getSelectAgreementType = async (request, h) => {
  const { document_id: documentId } = request.pre.document;

  const view = {
    ...request.view,
    caption: `Licence ${request.pre.licence.licenceNumber}`,
    pageTitle: 'Select agreement',
    form: sessionForms.get(request, selectAgreementType.form(request)),
    back: `/licences/${documentId}`
  };
  return h.view('nunjucks/agreements/form', view);
};

/**
 * Page 2: Add agreement flow - select date signed
 */
const getDateSigned = async (request, h) => {
  const { licence } = request.pre;
  const view = {
    ...request.view,
    caption: `Licence ${request.pre.licence.licenceNumber}`,
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
  const { startDate } = getSessionData(request);
  const view = {
    ...request.view,
    caption: `Licence ${request.pre.licence.licenceNumber}`,
    pageTitle: 'Check agreement start date',
    form: sessionForms.get(request, checkStartDate.form(request)),
    back: `/licences/${licence.id}/agreements/date-signed`,
    startDate,
    isLicenceStartDate: startDate === licence.startDate,
    isFinancialYearStartDate: moment(startDate).format('DD-MM') === '01-04'
  };
  return h.view('nunjucks/agreements/check-start-date', view);
};

const getCheckAnswers = async (request, h) => {
  const { flowState, licence } = request.pre;

  const view = {
    ...request.view,
    caption: `Licence ${request.pre.licence.licenceNumber}`,
    pageTitle: 'Check agreement details',
    back: `/licences/${licence.id}/agreements/check-start-date`,
    form: confirmForm.form(request),
    answers: [{
      label: 'Agreement',
      value: agreementDescriptions[flowState.code],
      visuallyHiddenText: 'agreement',
      link: `/licences/${licence.id}/agreements/select-type`
    }, {
      label: 'Date signed',
      value: moment(flowState.dateSigned).format('D MMMM YYYY'),
      visuallyHiddenText: 'date signed',
      link: `/licences/${licence.id}/agreements/date-signed`
    }, {
      label: 'Start date',
      value: moment(flowState.startDate).format('D MMMM YYYY'),
      visuallyHiddenText: 'start date',
      link: `/licences/${licence.id}/agreements/check-start-date`
    }]
  };
  return h.view('nunjucks/agreements/check-answers', view);
};

const postCheckAnswers = async (request, h) => {
  const { licenceId } = request.params;
  const { flowState, document } = request.pre;

  await water.licences.createAgreement(licenceId, flowState);

  clearSessionData(request);

  return h.redirect(`/licences/${document.document_id}#charge`);
};

exports.getDeleteAgreement = getDeleteAgreement;
exports.postDeleteAgreement = postDeleteAgreement;

exports.getSelectAgreementType = getSelectAgreementType;

exports.postSelectAgreementType = partialRight(createPostHandler, selectAgreementType, actions.setAgreementType, `/date-signed`);

exports.getDateSigned = getDateSigned;
exports.postDateSigned = partialRight(createPostHandler, dateSigned, actions.setDateSigned, `/check-start-date`);

exports.getCheckStartDate = getCheckStartDate;
exports.postCheckStartDate = partialRight(createPostHandler, checkStartDate, actions.setStartDate, `/check-answers`);

exports.getCheckAnswers = getCheckAnswers;
exports.postCheckAnswers = postCheckAnswers;
