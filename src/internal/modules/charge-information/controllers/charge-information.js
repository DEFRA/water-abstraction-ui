'use strict';

const forms = require('../forms');
const actions = require('../lib/actions');
const routing = require('../lib/routing');
const { createPostHandler, getDefaultView, applyFormResponse } = require('../lib/helpers');
const services = require('../../../lib/connectors/services');

const getLicencePageUrl = async licence => {
  const document = await services.crm.documents.getWaterLicence(licence.licenceNumber);
  return `/licences/${document.document_id}`;
};

/**
 * Select the reason for the creation of a new charge version
 */
const getReason = async (request, h) => {
  const licenceUrl = await getLicencePageUrl(request.pre.licence);

  return h.view('nunjucks/charge-information/form.njk', {
    ...getDefaultView(request, forms.reason, licenceUrl),
    pageTitle: 'Select reason for new charge information'
  });
};

const handleValidReasonRedirect = (request, formValues) => {
  const { licence } = request.pre;

  return formValues.reason === 'non-chargeable'
    ? routing.getNonChargeableReason(licence)
    : routing.getStartDate(licence);
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
  return h.view('nunjucks/charge-information/form.njk', {
    ...getDefaultView(request, forms.startDate, routing.getReason),
    pageTitle: 'Set charge start date'
  });
};

const postStartDate = createPostHandler(
  forms.startDate,
  actions.setStartDate,
  request => routing.getSelectBillingAccount(request.pre.licence)
);

const getSelectBillingAccount = async (request, h) => {
  const { billingAccounts } = request.pre;

  // if no accounts redirect to the create new account page
  if (billingAccounts.length === 0) {
    return h.redirect(routing.getCreateBillingAccount(request.pre.licence));
  }

  // we have billing accounts, get the name and populate the view
  const companyName = billingAccounts[0].company.name;

  return h.view('nunjucks/charge-information/form.njk', {
    ...getDefaultView(request, forms.billingAccount, routing.getStartDate),
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
  const { licence } = request.pre;

  return formValues.invoiceAccountAddress === 'set-up-new-billing-account'
    ? routing.getCreateBillingAccount(licence)
    : routing.getUseAbstractionData(licence);
};

const postSelectBillingAccount = createPostHandler(
  forms.billingAccount,
  actions.setBillingAccount,
  handleValidBillingAccountRedirect
);

const getUseAbstractionData = async (request, h) => {
  return h.view('nunjucks/charge-information/form.njk', {
    ...getDefaultView(request, forms.useAbstractionData, routing.getSelectBillingAccount),
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
  const { licence } = request.pre;
  return formValues.useAbstractionData
    ? routing.getCheckData(licence)
    : routing.getChargeElementStep(licence, 'purpose');
};

const postUseAbstractionData = createPostHandler(
  forms.useAbstractionData,
  actions.setAbstractionData,
  handleValidAbstractionDataRedirect
);

const getCheckData = async (request, h) => {
  const { licence, draftChargeInformation } = request.pre;

  const invoiceAccountAddress = draftChargeInformation.billingAccount.billingAccount.invoiceAccountAddresses.find(add => {
    return add.id === draftChargeInformation.billingAccount.invoiceAccountAddress;
  });

  const view = {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    back: routing.getUseAbstractionData(licence),
    pageTitle: 'Check charge information',
    draftChargeInformation,
    invoiceAccountAddress
  };

  return h.view('nunjucks/charge-information/check.njk', view);
};

const postCheckData = async (request, h) => {
  const { nextStep } = request.payload;
  const { licence } = request.pre;

  if (nextStep === 'confirm') {
    // send the draft data to the water service to save
    console.log('Collected data', request.pre.draftChargeInformation);
  } else {
    await applyFormResponse(request, {}, actions.clearData);
  }

  const url = await getLicencePageUrl(licence);
  return h.redirect(url);
};

exports.getCheckData = getCheckData;
exports.getReason = getReason;
exports.getSelectBillingAccount = getSelectBillingAccount;
exports.getStartDate = getStartDate;
exports.getUseAbstractionData = getUseAbstractionData;

exports.postCheckData = postCheckData;
exports.postReason = postReason;
exports.postSelectBillingAccount = postSelectBillingAccount;
exports.postStartDate = postStartDate;
exports.postUseAbstractionData = postUseAbstractionData;
