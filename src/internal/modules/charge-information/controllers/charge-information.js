'use strict';

const uuid = require('uuid');
const { get } = require('lodash');
const { isEmpty } = require('lodash');
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
  const licenceUrl = await getLicencePageUrl(request.pre.licence, true);
  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, licenceUrl, forms.reason),
    pageTitle: 'Select reason for new charge information'
  });
};

const handleValidReasonRedirect = (request, formValues) => {
  const { licenceId } = request.params;
  const chargeVersionWorkflowId = request.query.chargeVersionWorkflowId;
  return formValues.reason === 'non-chargeable'
    ? routing.getNonChargeableReason(licenceId, { chargeVersionWorkflowId })
    : routing.getStartDate(licenceId, { chargeVersionWorkflowId });
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
  async request => {
    const { licenceId } = request.params;
    const { chargeVersionWorkflowId } = request.query;
    return routing.getSelectBillingAccount(licenceId, { chargeVersionWorkflowId });
  }
);

const getBillingAccountRedirectKey = (licenceId, chargeVersionWorkflowId) =>
  isEmpty(chargeVersionWorkflowId) ? `charge-information-${licenceId}` : `charge-information-${licenceId}-${chargeVersionWorkflowId}`;

/**
 * Maps licence and document to an object data for handover to the
 * billing account plugin flow
 * @param {Object} licence
 * @param {Object} document
 * @return {Object} data for billing account plugin handover
 */
const mapBillingAccountHandoverData = (licence, document, currentState, chargeVersionWorkflowId, isCheckAnswers = false) => {
  const { licenceNumber, id, region: { id: regionId } } = licence;
  // Get company ID from document
  const { company: { id: companyId } } = document.roles.find(role => role.roleName === 'licenceHolder');

  // Get currently selected billing account ID
  const billingAccountId = get(currentState, 'invoiceAccount.id');
  const { dateRange: { startDate } } = currentState;

  return {
    caption: `Licence ${licenceNumber}`,
    key: getBillingAccountRedirectKey(id, chargeVersionWorkflowId),
    companyId,
    regionId,
    back: `/licences/${id}/charge-information/start-date`,
    redirectPath: routing.getHandleBillingAccount(id, { returnToCheckData: isCheckAnswers, chargeVersionWorkflowId }),
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
  const { returnToCheckData, chargeVersionWorkflowId } = request.query;
  const { draftChargeInformation: currentState } = request.pre;

  // Get start date of new charge version, and associated CRM v2 document
  const { dateRange: { startDate } } = request.getDraftChargeInformation(licenceId, chargeVersionWorkflowId);
  const document = await services.water.licences.getValidDocumentByLicenceIdAndDate(licenceId, startDate);

  // Return redirect path to billing account entry flow
  const data = mapBillingAccountHandoverData(request.pre.licence, document, currentState, chargeVersionWorkflowId, returnToCheckData);
  const path = request.billingAccountEntryRedirect(data);
  return h.redirect(path);
};

/**
 * Sets the billing account and redirects to the "use abstraction data" page
 */
const getHandleBillingAccount = async (request, h) => {
  const { licenceId } = request.params;
  const { draftChargeInformation: currentState } = request.pre;
  const { returnToCheckData, chargeVersionWorkflowId } = request.query;

  // Create action to set billing account ID
  const { id } = request.getBillingAccount(getBillingAccountRedirectKey(licenceId, chargeVersionWorkflowId));
  const action = actions.setBillingAccount(id);

  // Calculate next state
  const nextState = reducer(currentState, action);
  request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, nextState);

  // Redirect to next page in flow
  const path = returnToCheckData
    ? routing.getCheckData(licenceId, { chargeVersionWorkflowId })
    : routing.getUseAbstractionData(licenceId, { chargeVersionWorkflowId });

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
  const { chargeVersionWorkflowId } = request.query;
  return formValues.useAbstractionData === 'no'
    ? routing.getChargeElementStep(licenceId, uuid(), CHARGE_ELEMENT_STEPS.purpose, request.query)
    : routing.getCheckData(licenceId, { chargeVersionWorkflowId });
};

const postUseAbstractionData = createPostHandler(
  forms.useAbstractionData,
  actions.setAbstractionData,
  handleValidAbstractionDataRedirect
);

const getCheckData = async (request, h) => {
  const { draftChargeInformation, isChargeable, billingAccount } = request.pre;
  const { licenceId } = request.params;
  const back = isChargeable
    ? routing.getUseAbstractionData(licenceId, request.query)
    : routing.getEffectiveDate(licenceId, request.query);

  const billingAccountAddress = getCurrentBillingAccountAddress(billingAccount);
  const editChargeVersionWarning = await isOverridingChargeVersion(request, draftChargeInformation.dateRange.startDate);
  const action = routing.getCheckData(licenceId, request.query);
  const view = {
    ...getDefaultView(request, back),
    action,
    pageTitle: 'Check charge information',
    chargeVersion: chargeInformationValidator.addValidation(draftChargeInformation),
    licenceId: request.params.licenceId,
    billingAccountAddress,
    billingAccount,
    chargeVersionWorkflowId: request.query.chargeVersionWorkflowId,
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
  const { user_id: userId, user_name: userName } = get(request, 'defra.user');
  const patchObject = {
    status: 'review',
    approverComments: preparedChargeInfo.chargeVersion.approverComments,
    chargeVersion: preparedChargeInfo.chargeVersion,
    createdBy: { id: userId, email: userName }
  };
  await services.water.chargeVersionWorkflows.patchChargeVersionWorkflow(
    preparedChargeInfo.chargeVersion.chargeVersionWorkflowId,
    patchObject
  );
  const route = routing.getSubmitted(id, { chargeable: isChargeable });
  return h.redirect(route);
};

const submitDraftChargeInformation = async (request, h) => {
  const { licence: { id }, draftChargeInformation, isChargeable } = request.pre;
  const { chargeVersionWorkflowId } = request.query;
  const preparedChargeInfo = prepareChargeInformation(id, draftChargeInformation);
  preparedChargeInfo.chargeVersion['status'] = 'draft';
  const { user_id: userId, user_name: userName } = get(request, 'defra.user');
  if (isEmpty(chargeVersionWorkflowId)) {
    await services.water.chargeVersionWorkflows.postChargeVersionWorkflow(preparedChargeInfo);
  } else {
    const patchObject = {
      status: 'review',
      approverComments: null,
      chargeVersion: preparedChargeInfo.chargeVersion,
      createdBy: { id: userId, email: userName }
    };
    await services.water.chargeVersionWorkflows.patchChargeVersionWorkflow(
      chargeVersionWorkflowId,
      patchObject
    );
  }
  await applyFormResponse(request, {}, actions.clearData);
  const route = routing.getSubmitted(id, { chargeable: isChargeable });
  return h.redirect(route);
};

const redirectToCancelPage = (request, h) =>
  h.redirect(routing.getCancelData(request.params.licenceId));

const redirectToStartOfElementFlow = (request, h) => {
  const { licenceId } = request.params;
  // need to generate new id for new charge element
  return h.redirect(routing.getChargeElementStep(licenceId, uuid(), CHARGE_ELEMENT_FIRST_STEP, request.query));
};

const removeElement = async (request, h) => {
  await applyFormResponse(request, {}, actions.removeChargeElement);
  return h.redirect(routing.getCheckData(request.params.licenceId, request.query));
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
    ...getDefaultView(request, routing.getCheckData, forms.deleteChargeInfo),
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
  const licencePageUrl = await getLicencePageUrl(licence, true);

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
