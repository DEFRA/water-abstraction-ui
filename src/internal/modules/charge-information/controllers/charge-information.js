'use strict';

const forms = require('../forms');
const actions = require('../lib/actions');
const routing = require('../lib/routing');
const {
  createPostHandler,
  getDefaultView,
  applyFormResponse,
  prepareChargeInformation,
  getLicencePageUrl,
  findInvoiceAccountAddress
} = require('../lib/helpers');
const chargeInformationValidator = require('../lib/charge-information-validator');
const { CHARGE_ELEMENT_FIRST_STEP, CHARGE_ELEMENT_STEPS } = require('../lib/charge-elements/constants');
const services = require('../../../lib/connectors/services');
const uuid = require('uuid');

/**
 * Select the reason for the creation of a new charge version
 */
const getReason = async (request, h) => {
  const licenceUrl = await getLicencePageUrl(request.pre.licence);
  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, licenceUrl, forms.reason),
    pageTitle: 'Select reason for new charge information'
  });
};

const handleValidReasonRedirect = (request, formValues) => {
  const { licenceId } = request.params;
  return formValues.reason === 'non-chargeable'
    ? routing.getNonChargeableReason(licenceId)
    : routing.getStartDate(licenceId);
};

const postReason = createPostHandler(
  forms.reason,
  actions.setChangeReason,
  handleValidReasonRedirect
);

/**
 * Select the start date for the new charge version
 */
const getStartDate = async (request, h) => {
  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, routing.getReason, forms.startDate),
    pageTitle: 'Set charge start date'
  });
};

const postStartDate = createPostHandler(
  forms.startDate,
  actions.setStartDate,
  request => routing.getSelectBillingAccount(request.params.licenceId)
);

const getSelectBillingAccount = async (request, h) => {
  const { billingAccounts, licence, licenceHolderRole } = request.pre;

  // if no accounts redirect to the create new account page
  if (billingAccounts.length === 0) {
    const redirectPath = routing.getCreateBillingAccount(licence, licenceHolderRole, 'use-abstraction-data');
    return h.redirect(redirectPath);
  }

  // we have billing accounts, get the name and populate the view
  const companyName = billingAccounts[0].company.name;

  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, routing.getStartDate, forms.billingAccount),
    pageTitle: `Select an existing billing account for ${companyName}`
  });
};

/**
 * Handles the redirection to the next step when value billing account
 * data has been selected. Either the user wants to create a new billing
 * account, in which case redirect there, or move on to the next step.
 *
 * @param {Object} request
 * @param {Object} formValues
 */
const handleValidBillingAccountRedirect = (request, formValues) => {
  const { licence, licenceHolderRole } = request.pre;
  if (formValues.invoiceAccountAddress === 'set-up-new-billing-account') {
    const { returnToCheckData } = request.query;
    const redirect = returnToCheckData === 1 ? 'check' : 'use-abstraction-data';
    return routing.getCreateBillingAccount(licence, licenceHolderRole, redirect);
  }
  return routing.getUseAbstractionData(licence.id);
};

const postSelectBillingAccount = createPostHandler(
  forms.billingAccount,
  actions.setBillingAccount,
  handleValidBillingAccountRedirect
);

const getUseAbstractionData = async (request, h) => {
  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, routing.getSelectBillingAccount, forms.useAbstractionData),
    pageTitle: 'Use abstraction data to set up the element?'
  });
};

/*
* Handles the redirection to the next step when value billing account
* data has been selected. Either the user wants to create a new billing
* account, in which case redirect there, or move on to the next step.
*
* @param {Object} request
* @param {Object} formValues
*/
const handleValidAbstractionDataRedirect = (request, formValues) => {
  const { licenceId } = request.params;
  return formValues.useAbstractionData
    ? routing.getCheckData(licenceId)
    : routing.getChargeElementStep(licenceId, uuid(), CHARGE_ELEMENT_STEPS.purpose);
};

const postUseAbstractionData = createPostHandler(
  forms.useAbstractionData,
  actions.setAbstractionData,
  handleValidAbstractionDataRedirect
);

const getCheckData = async (request, h) => {
  const { draftChargeInformation, isChargeable } = request.pre;
  const { chargeVersionWorkflowId, licenceId } = request.params;
  const back = isChargeable
    ? routing.getUseAbstractionData(licenceId)
    : routing.getEffectiveDate(licenceId);

  const invoiceAccountAddress = findInvoiceAccountAddress(request);

  const view = {
    ...getDefaultView(request, back),
    pageTitle: 'Check charge information',
    chargeVersion: chargeInformationValidator.addValidation(draftChargeInformation),
    licenceId: request.params.licenceId,
    invoiceAccountAddress,
    chargeVersionWorkflowId,
    isChargeable,
    isEditable: true,
    isXlHeading: true
  };

  return h.view('nunjucks/charge-information/view.njk', view);
};

const updateDraftChargeInformation = async (request, h) => {
  const { licence: { id }, draftChargeInformation, isChargeable } = request.pre;

  const preparedChargeInfo = prepareChargeInformation(id, draftChargeInformation);
  preparedChargeInfo.chargeVersion['status'] = 'draft';

  await services.water.chargeVersionWorkflows.patchChargeVersionWorkflow('review', preparedChargeInfo.chargeVersion.approverComments, preparedChargeInfo.chargeVersion, preparedChargeInfo.chargeVersion.chargeVersionWorkflowId);
  const route = routing.getSubmitted(id, isChargeable);
  return h.redirect(route);
};

const submitDraftChargeInformation = async (request, h) => {
  const { licence: { id }, draftChargeInformation, isChargeable } = request.pre;

  const preparedChargeInfo = prepareChargeInformation(id, draftChargeInformation);
  preparedChargeInfo.chargeVersion['status'] = 'draft';
  await services.water.chargeVersionWorkflows.postChargeVersionWorkflow(preparedChargeInfo);
  await applyFormResponse(request, {}, actions.clearData);
  const route = routing.getSubmitted(id, isChargeable);
  return h.redirect(route);
};

const redirectToCancelPage = (request, h) =>
  h.redirect(routing.getCancelData(request.params.licenceId));

const redirectToStartOfElementFlow = (request, h) => {
  const { licenceId } = request.params;
  // need to generate new id for new charge element
  return h.redirect(routing.getChargeElementStep(licenceId, uuid(), CHARGE_ELEMENT_FIRST_STEP));
};

const removeElement = async (request, h) => {
  await applyFormResponse(request, {}, actions.removeChargeElement);
  return h.redirect(routing.getCheckData(request.params.licenceId));
};

const checkDataButtonActions = {
  update: updateDraftChargeInformation,
  confirm: submitDraftChargeInformation,
  cancel: redirectToCancelPage,
  addElement: redirectToStartOfElementFlow,
  removeElement: removeElement
};

const postCheckData = async (request, h) => {
  const { buttonAction } = request.payload;
  const [action] = buttonAction.split(':');
  return checkDataButtonActions[action](request, h);
};

const getCancelData = (request, h) =>
  h.view('nunjucks/charge-information/cancel.njk', {
    ...getDefaultView(request, routing.getCheckData, forms.cancelChargeInfo),
    pageTitle: 'You\'re about to cancel this charge information',
    draftChargeInformation: request.pre.draftChargeInformation
  });

const postCancelData = async (request, h) => {
  const { licence, draftChargeInformation: { chargeVersionWorkflowId } } = request.pre;
  if (chargeVersionWorkflowId) {
    await services.water.chargeVersionWorkflows.deleteChargeVersionWorkflow(chargeVersionWorkflowId);
  }
  await applyFormResponse(request, {}, actions.clearData);

  const url = await getLicencePageUrl(licence);
  return h.redirect(url);
};

const getSubmitted = async (request, h) => {
  const { licence } = request.pre;
  const { chargeable: isChargeable } = request.query;
  const licencePageUrl = await getLicencePageUrl(licence);

  return h.view('nunjucks/charge-information/submitted.njk', {
    ...getDefaultView(request),
    pageTitle: 'Charge information complete',
    licencePageUrl,
    isChargeable
  });
};

exports.getCancelData = getCancelData;
exports.getCheckData = getCheckData;
exports.getReason = getReason;
exports.getSelectBillingAccount = getSelectBillingAccount;
exports.getStartDate = getStartDate;
exports.getSubmitted = getSubmitted;
exports.getUseAbstractionData = getUseAbstractionData;

exports.postCancelData = postCancelData;
exports.postCheckData = postCheckData;
exports.postReason = postReason;
exports.postSelectBillingAccount = postSelectBillingAccount;
exports.postStartDate = postStartDate;
exports.postUseAbstractionData = postUseAbstractionData;
