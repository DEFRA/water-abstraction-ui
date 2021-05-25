'use strict';

const { isFunction, isEmpty, omit, get } = require('lodash');

const { handleRequest, getValues } = require('shared/lib/forms');
const sessionForms = require('shared/lib/session-forms');
const services = require('../../../lib/connectors/services');

const { reducer } = require('./reducer');
const routing = require('../lib/routing');

const getPostedForm = (request, formContainer) => {
  const schema = formContainer.schema(request);
  return handleRequest(formContainer.form(request), request, schema);
};

const applyFormResponse = (request, form, actionCreator) => {
  const { licenceId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  const action = actionCreator(request, getValues(form));
  const nextState = reducer(request.pre.draftChargeInformation, action);
  return isEmpty(nextState)
    ? request.clearDraftChargeInformation(licenceId, chargeVersionWorkflowId)
    : request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, nextState);
};

/**
 * Determine whether the url is part of the charge information
 * flow to allow the user to go through an external multi-page flow
 * before returning to the check your answers page
 * @param {String} url
 */
const isUrlChargeInformationPage = url => {
  const [baseUrl] = url.split('?');
  return baseUrl.includes('charge-information');
};

const getRedirectPath = (request, nextPageInFlowUrl) => {
  const { returnToCheckData, chargeVersionWorkflowId } = request.query;
  const isChargeInformationPage = isUrlChargeInformationPage(nextPageInFlowUrl);
  if (returnToCheckData && isChargeInformationPage) {
    if (request.pre.draftChargeInformation.status === 'review') {
      return routing.getReview(chargeVersionWorkflowId, request.params.licenceId);
    }
    return routing.getCheckData(request.params.licenceId, { chargeVersionWorkflowId });
  }
  return nextPageInFlowUrl;
};

const createPostHandler = (formContainer, actionCreator, redirectPathFunc) => async (request, h) => {
  const form = getPostedForm(request, formContainer);

  if (form.isValid) {
    await applyFormResponse(request, form, actionCreator);
    const defaultPath = await redirectPathFunc(request, getValues(form));
    const redirectPath = await getRedirectPath(request, defaultPath);
    return h.redirect(redirectPath);
  }
  return h.postRedirectGet(form);
};

const getDefaultView = (request, backLink, formContainer) => {
  const licence = request.pre.licence;
  const back = isFunction(backLink) ? backLink(licence.id, request.query) : backLink;

  const view = {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    back
  };
  if (formContainer) {
    view.form = sessionForms.get(request, formContainer.form(request));
  }
  return view;
};

const prepareChargeInformation = (licenceId, chargeData) => ({
  licenceId,
  chargeVersion: {
    ...chargeData,
    chargeElements: chargeData.chargeElements.map(element => omit(element, 'id')),
    status: 'draft'
  }
});

const getLicencePageUrl = licence => `/licences/${licence.id}#charge`;

const isCurrentAddress = invoiceAccountAddress => invoiceAccountAddress.dateRange.endDate === null;

const getCurrentBillingAccountAddress = billingAccount => get(billingAccount, 'invoiceAccountAddresses', []).find(isCurrentAddress);

/**
 * Checks if the new draft charge version has the same start date as an existing charge version
 * @param {*} request hapi request object
 * @param {*} draftChargeVersionStartDate the start date of the draft charge version
 */
const isOverridingChargeVersion = async (request, draftChargeVersionStartDate) => {
  const { data: chargeVersions } = await services.water.chargeVersions.getChargeVersionsByLicenceId(request.pre.licence.id);
  return !!chargeVersions.find(version => version.dateRange.startDate === draftChargeVersionStartDate);
};

exports.isOverridingChargeVersion = isOverridingChargeVersion;
exports.getLicencePageUrl = getLicencePageUrl;
exports.getPostedForm = getPostedForm;
exports.applyFormResponse = applyFormResponse;
exports.createPostHandler = createPostHandler;
exports.getDefaultView = getDefaultView;
exports.prepareChargeInformation = prepareChargeInformation;
exports.getCurrentBillingAccountAddress = getCurrentBillingAccountAddress;
