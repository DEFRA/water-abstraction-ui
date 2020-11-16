const { handleRequest, getValues } = require('shared/lib/forms');
const { reducer } = require('./reducer');
const sessionForms = require('shared/lib/session-forms');
const { isFunction, isEmpty, omit } = require('lodash');
const routing = require('../lib/routing');
const services = require('../../../lib/connectors/services');

const getPostedForm = (request, formContainer) => {
  const schema = formContainer.schema(request);
  return handleRequest(formContainer.form(request), request, schema);
};

const applyFormResponse = (request, form, actionCreator) => {
  const { licenceId } = request.params;
  const action = actionCreator(request, getValues(form));
  const nextState = reducer(request.pre.draftChargeInformation, action);
  return isEmpty(nextState)
    ? request.clearDraftChargeInformation(licenceId)
    : request.setDraftChargeInformation(licenceId, nextState);
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
  const { returnToCheckData } = request.query;
  const isChargeInformationPage = isUrlChargeInformationPage(nextPageInFlowUrl);
  if (returnToCheckData === 1 && isChargeInformationPage) {
    return routing.getCheckData(request.params.licenceId);
  }
  return nextPageInFlowUrl;
};

const createPostHandler = (formContainer, actionCreator, redirectPathFunc) => async (request, h) => {
  const form = getPostedForm(request, formContainer);

  if (form.isValid) {
    await applyFormResponse(request, form, actionCreator);
    const redirectPath = getRedirectPath(request, redirectPathFunc(request, getValues(form)));
    return h.redirect(redirectPath);
  }
  return h.postRedirectGet(form);
};

const getDefaultView = (request, backLink, formContainer) => {
  const licence = request.pre.licence;
  const back = isFunction(backLink) ? backLink(licence.id) : backLink;

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
    chargeElements: chargeData.chargeElements.map(element => omit(element, 'id'))
  }
});

const getLicencePageUrl = async licence => {
  const document = await services.crm.documents.getWaterLicence(licence.licenceNumber);
  return `/licences/${document.document_id}#charge`;
};

const findInvoiceAccountAddress = request => {
  const { draftChargeInformation, isChargeable } = request.pre;
  const address = draftChargeInformation.invoiceAccount.invoiceAccountAddresses
    .find(eachAddress => eachAddress.id === draftChargeInformation.invoiceAccount.invoiceAccountAddress);
  return isChargeable ? address : null;
};

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
exports.getLicencePageUrl = getLicencePageUrl;
exports.findInvoiceAccountAddress = findInvoiceAccountAddress;
