'use strict';

const uuid = require('uuid');
const { get } = require('lodash');

const forms = require('../forms');
const actions = require('../lib/actions');
const routing = require('../lib/routing');
const {
  createPostHandler,
  getDefaultView,
  applyFormResponse,
  prepareChargeInformation,
  getLicencePageUrl,
  isOverridingChargeVersion,
  getCurrentBillingAccountAddress
} = require('../lib/helpers');
const chargeInformationValidator = require('../lib/charge-information-validator');
const { CHARGE_ELEMENT_FIRST_STEP, CHARGE_ELEMENT_STEPS } = require('../lib/charge-elements/constants');
const services = require('../../../lib/connectors/services');
const { reducer } = require('../lib/reducer');

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

const getBillingAccountRedirectKey = licenceId => `charge-information-${licenceId}`;

const postStartDate = createPostHandler(
  forms.startDate,
  actions.setStartDate,
  async request => {
    const { licenceId } = request.params;
    return routing.getSelectBillingAccount(licenceId);
  }
);

/**
 * Maps licence and document to an object data for handover to the
 * billing account plugin flow
 * @param {Object} licence
 * @param {Object} document
 * @return {Object} data for billing account plugin handover
 */
const mapBillingAccountHandoverData = (licence, document, currentState, isCheckAnswers = false) => {
  const { licenceNumber, id, region: { id: regionId } } = licence;
  // Get company ID from document
  const { company: { id: companyId } } = document.roles.find(role => role.roleName === 'licenceHolder');

  // Get currently selected billing account ID
  const billingAccountId = get(currentState, 'invoiceAccount.id');
  const { dateRange: { startDate } } = currentState;

  return {
    caption: `Licence ${licenceNumber}`,
    key: getBillingAccountRedirectKey(id),
    companyId,
    regionId,
    back: `/licences/${id}/charge-information/start-date`,
    redirectPath: routing.getHandleBillingAccount(id, isCheckAnswers),
    ...billingAccountId && { data: {
      id: billingAccountId
    } },
    startDate
  };
};

/**
 * Redirects to billing account plugin
 * @param {*} request
 * @param {*} h
 */
const getBillingAccount = async (request, h) => {
  const { licenceId } = request.params;
  const { returnToCheckData } = request.query;
  const { draftChargeInformation: currentState } = request.pre;

  // Get start date of new charge version, and associated CRM v2 document
  const { dateRange: { startDate } } = request.getDraftChargeInformation(licenceId);
  const document = await services.water.licences.getValidDocumentByLicenceIdAndDate(licenceId, startDate);

  // Return redirect path to billing account entry flow
  const data = mapBillingAccountHandoverData(request.pre.licence, document, currentState, returnToCheckData);
  const path = request.billingAccountEntryRedirect(data);
  return h.redirect(path);
};

/**
 * Sets the billing account and redirects to the "use abstraction data" page
 */
const getHandleBillingAccount = async (request, h) => {
  const { licenceId } = request.params;
  const { draftChargeInformation: currentState } = request.pre;
  const { returnToCheckData } = request.query;

  // Create action to set billing account ID
  const { id } = request.getBillingAccount(getBillingAccountRedirectKey(licenceId));
  const action = actions.setBillingAccount(id);

  // Calculate next state
  const nextState = reducer(currentState, action);
  request.setDraftChargeInformation(licenceId, nextState);

  // Redirect to next page in flow
  const path = returnToCheckData
    ? routing.getCheckData(licenceId)
    : routing.getUseAbstractionData(licenceId);

  return h.redirect(path);
};

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
  return formValues.useAbstractionData === 'no'
    ? routing.getChargeElementStep(licenceId, uuid(), CHARGE_ELEMENT_STEPS.purpose)
    : routing.getCheckData(licenceId);
};

const postUseAbstractionData = createPostHandler(
  forms.useAbstractionData,
  actions.setAbstractionData,
  handleValidAbstractionDataRedirect
);

const getCheckData = async (request, h) => {
  const { draftChargeInformation, isChargeable, billingAccount } = request.pre;
  const { chargeVersionWorkflowId, licenceId } = request.params;
  const back = isChargeable
    ? routing.getUseAbstractionData(licenceId)
    : routing.getEffectiveDate(licenceId);

  const billingAccountAddress = getCurrentBillingAccountAddress(billingAccount);
  const editChargeVersionWarning = await isOverridingChargeVersion(request, draftChargeInformation.dateRange.startDate);
  const view = {
    ...getDefaultView(request, back),
    pageTitle: 'Check charge information',
    chargeVersion: chargeInformationValidator.addValidation(draftChargeInformation),
    licenceId: request.params.licenceId,
    billingAccountAddress,
    billingAccount,
    chargeVersionWorkflowId,
    isChargeable,
    isEditable: true,
    isXlHeading: true,
    editChargeVersionWarning
  };

  return h.view('nunjucks/charge-information/view.njk', view);
};

const updateDraftChargeInformation = async (request, h) => {
  const { licence: { id }, draftChargeInformation, isChargeable } = request.pre;

  const preparedChargeInfo = prepareChargeInformation(id, draftChargeInformation);
  preparedChargeInfo.chargeVersion['status'] = 'draft';

  await services.water.chargeVersionWorkflows.patchChargeVersionWorkflow(
    preparedChargeInfo.chargeVersion.chargeVersionWorkflowId,
    'review',
    preparedChargeInfo.chargeVersion.approverComments,
    preparedChargeInfo.chargeVersion
  );
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
exports.getStartDate = getStartDate;
exports.getBillingAccount = getBillingAccount;
exports.getHandleBillingAccount = getHandleBillingAccount;
exports.getSubmitted = getSubmitted;
exports.getUseAbstractionData = getUseAbstractionData;

exports.postCancelData = postCancelData;
exports.postCheckData = postCheckData;
exports.postReason = postReason;
exports.postStartDate = postStartDate;
exports.postUseAbstractionData = postUseAbstractionData;
