'use strict';

const { get } = require('lodash');

const forms = require('./forms');
const actions = require('./lib/actions');
const routing = require('./lib/routing');
const { createPostHandler, getDefaultView, applyFormResponse } = require('./lib/helpers');
const services = require('../../lib/connectors/services');

const getLicencePageUrl = async licence => {
  const document = await services.crm.documents.getWaterLicence(licence.licenceNumber);
  return `/licences/${document.document_id}#charge`;
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

const postUseAbstractionData = createPostHandler(
  forms.useAbstractionData,
  actions.setAbstractionData,
  request => routing.getCheckData(request.pre.licence)
);

const getInvoiceAccountAddressFromDraft = draftChargeInformation => {
  const invoiceAccountAddresses = get(draftChargeInformation, 'billingAccount.billingAccount.invoiceAccountAddresses', []);
  const invoiceAccountAddress = get(draftChargeInformation, 'billingAccount.invoiceAccountAddress');

  return invoiceAccountAddresses.find(add => add.id === invoiceAccountAddress);
};

const getCheckData = async (request, h) => {
  const { licence, draftChargeInformation, isChargeable } = request.pre;
  const back = isChargeable
    ? routing.getUseAbstractionData(licence)
    : routing.getEffectiveDate(licence);

  const view = {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    back,
    pageTitle: 'Check charge information',
    draftChargeInformation,
    licence,
    invoiceAccountAddress: getInvoiceAccountAddressFromDraft(draftChargeInformation),
    isChargeable
  };

  return h.view('nunjucks/charge-information/check.njk', view);
};

const postCheckData = async (request, h) => {
  const { nextStep } = request.payload;
  const { licence, isChargeable } = request.pre;

  if (nextStep === 'confirm') {
    // send the draft data to the water service to save
    console.log('Collected data', request.pre.draftChargeInformation);

    return h.redirect(routing.getConfirm(licence, isChargeable));
  }

  await applyFormResponse(request, {}, actions.clearData);

  const url = await getLicencePageUrl(licence);
  return h.redirect(url);
};

const getNonChargeableReason = async (request, h) => {
  const { licence } = request.pre;
  const backUrl = request.query.start
    ? await getLicencePageUrl(request.pre.licence)
    : routing.getReason(licence);

  return h.view('nunjucks/charge-information/form.njk', {
    ...getDefaultView(request, forms.nonChargeableReason, backUrl),
    pageTitle: 'Why is this licence not chargeable?'
  });
};

const postNonChargeableReason = createPostHandler(
  forms.nonChargeableReason,
  actions.setChangeReason,
  request => routing.getEffectiveDate(request.pre.licence)
);

const getEffectiveDate = async (request, h) => {
  return h.view('nunjucks/charge-information/form.njk', {
    ...getDefaultView(request, forms.startDate, routing.getNonChargeableReason),
    pageTitle: 'Enter effective date'
  });
};

const postEffectiveDate = createPostHandler(
  forms.startDate,
  actions.setStartDate,
  request => routing.getCheckData(request.pre.licence)
);

const getConfirm = async (request, h) => {
  const { licence } = request.pre;

  return h.view('nunjucks/charge-information/confirm.njk', {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    licenceUrl: await getLicencePageUrl(licence),
    licence,
    isChargeable: get(request, 'query.chargeable', false),
    pageTitle: 'Charge information complete'
  });
};

exports.getCheckData = getCheckData;
exports.getConfirm = getConfirm;
exports.getEffectiveDate = getEffectiveDate;
exports.getNonChargeableReason = getNonChargeableReason;
exports.getReason = getReason;
exports.getSelectBillingAccount = getSelectBillingAccount;
exports.getStartDate = getStartDate;
exports.getUseAbstractionData = getUseAbstractionData;

exports.postCheckData = postCheckData;
exports.postEffectiveDate = postEffectiveDate;
exports.postNonChargeableReason = postNonChargeableReason;
exports.postReason = postReason;
exports.postSelectBillingAccount = postSelectBillingAccount;
exports.postStartDate = postStartDate;
exports.postUseAbstractionData = postUseAbstractionData;
