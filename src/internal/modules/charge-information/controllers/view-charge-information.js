const {
  getDefaultView,
  getLicencePageUrl,
  getCurrentBillingAccountAddress,
  prepareChargeInformation
} = require('../lib/helpers');
const { get } = require('lodash');
const forms = require('shared/lib/forms');
const services = require('../../../lib/connectors/services');
const chargeInformationValidator = require('../lib/charge-information-validator');
const { chargeVersionWorkflowReviewer, manageBillingAccounts } = require('internal/lib/constants').scope;
const { reviewForm, reviewFormSchema } = require('../forms/review');
const { hasScope } = require('internal/lib/permissions');
const moment = require('moment');

const formatDateForPageTitle = startDate =>
  moment(startDate).format('D MMMM YYYY');

const getViewChargeInformation = async (request, h) => {
  const { chargeVersion, licence, billingAccount } = request.pre;
  const { chargeVersionWorkflowId } = request.params;
  const backLink = await getLicencePageUrl(licence, true);

  const { data: documentRoles } = await services.crm.documentRoles.getDocumentRolesByDocumentRef(licence.licenceNumber);
  console.log(documentRoles);
  const billingAccountAddress = getCurrentBillingAccountAddress(billingAccount);

  return h.view('nunjucks/charge-information/view', {
    ...getDefaultView(request, backLink),
    pageTitle: `Charge information valid from ${formatDateForPageTitle(chargeVersion.dateRange.startDate)}`,
    chargeVersion,
    isEditable: false,
    chargeVersionWorkflowId,
    billingAccount,
    billingAccountAddress,
    documentRoles,
    links: {
      billingAccount: hasScope(request, manageBillingAccounts) && `/billing-accounts/${billingAccount.id}`
    },
    // @TODO: use request.pre.isChargeable to determine this
    // after the chargeVersion import ticket has been completed
    // In the meantime, it will use chargeVersion.changeReason.type === 'new_non_chargeable_charge_version'
    isChargeable: get(chargeVersion, 'changeReason.type') !== 'new_non_chargeable_charge_version'
  });
};

const getReviewChargeInformation = async (request, h) => {
  const { draftChargeInformation, licence, isChargeable, billingAccount } = request.pre;
  const { chargeVersionWorkflowId } = request.params;
  const backLink = await getLicencePageUrl(licence, true);
  const isApprover = hasScope(request, chargeVersionWorkflowReviewer);
  const billingAccountAddress = getCurrentBillingAccountAddress(billingAccount);
  const validatedDraftChargeVersion = chargeInformationValidator.addValidation(draftChargeInformation);
  return h.view('nunjucks/charge-information/view', {
    ...getDefaultView(request, backLink),
    pageTitle: `Check charge information`,
    chargeVersion: validatedDraftChargeVersion,
    billingAccount,
    billingAccountAddress,
    licenceId: licence.id,
    isEditable: draftChargeInformation.status === 'changes_requested' || draftChargeInformation.status === 'review',
    isApprover,
    isChargeable,
    chargeVersionWorkflowId,
    action: `/licences/${licence.id}/charge-information/check?chargeVersionWorkflowId=${chargeVersionWorkflowId}`,
    reviewForm: reviewForm(request)
  });
};

const postReviewChargeInformation = async (request, h) => {
  const { draftChargeInformation, licence, isChargeable, billingAccount } = request.pre;
  const backLink = await getLicencePageUrl(licence, true);
  const isApprover = hasScope(request, chargeVersionWorkflowReviewer);
  const invoiceAccountAddress = getCurrentBillingAccountAddress(billingAccount);
  const { chargeVersionWorkflowId } = request.params;
  const form = forms.handleRequest(
    reviewForm(request),
    request,
    reviewFormSchema(request)
  );
  if (!form.isValid) {
    return h.view('nunjucks/charge-information/view', {
      ...getDefaultView(request, backLink),
      pageTitle: `Check charge information`,
      chargeVersion: chargeInformationValidator.addValidation(draftChargeInformation),
      invoiceAccountAddress,
      licenceId: licence.id,
      chargeVersionWorkflowId,
      isEditable: draftChargeInformation.status === 'changes_requested',
      isApprover,
      isChargeable,
      reviewForm: form
    });
  } else {
    const preparedChargeInfo = prepareChargeInformation(licence.id, draftChargeInformation);
    const patchObject = {
      status: request.payload.reviewOutcome === 'approve' ? 'review' : request.payload.reviewOutcome,
      approverComments: request.payload.reviewerComments || 'review',
      chargeVersion: preparedChargeInfo.chargeVersion
    };

    await services.water.chargeVersionWorkflows.patchChargeVersionWorkflow(
      request.params.chargeVersionWorkflowId,
      patchObject
    );
    if (request.payload.reviewOutcome === 'approve') {
      await services.water.chargeVersions.postCreateFromWorkflow(request.params.chargeVersionWorkflowId);
    }
    // Clear session
    request.clearDraftChargeInformation(licence.id, chargeVersionWorkflowId);

    return h.redirect(`/licences/${licence.id}#charge`);
  }
};

exports.getViewChargeInformation = getViewChargeInformation;
exports.getReviewChargeInformation = getReviewChargeInformation;
exports.postReviewChargeInformation = postReviewChargeInformation;
