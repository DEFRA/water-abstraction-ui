const {
  getDefaultView,
  getLicencePageUrl,
  getCurrentBillingAccountAddress
} = require('../lib/helpers');
const { get } = require('lodash');
const forms = require('shared/lib/forms');
const services = require('../../../lib/connectors/services');
const chargeInformationValidator = require('../lib/charge-information-validator');
const { chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const { reviewForm, reviewFormSchema } = require('../forms/review');
const { hasScope } = require('internal/lib/permissions');
const moment = require('moment');
const preHandlers = require('../pre-handlers');

const formatDateForPageTitle = startDate =>
  moment(startDate).format('D MMMM YYYY');

const getViewChargeInformation = async (request, h) => {
  const { chargeVersion, licence, billingAccount } = request.pre;
  const { chargeVersionWorkflowId } = request.params;
  const backLink = await getLicencePageUrl(licence, true);

  const billingAccountAddress = getCurrentBillingAccountAddress(billingAccount);

  return h.view('nunjucks/charge-information/view', {
    ...getDefaultView(request, backLink),
    pageTitle: `Charge information valid from ${formatDateForPageTitle(chargeVersion.dateRange.startDate)}`,
    chargeVersion,
    isEditable: false,
    chargeVersionWorkflowId,
    billingAccount,
    billingAccountAddress,
    // @TODO: use request.pre.isChargeable to determine this
    // after the chargeVersion import ticket has been completed
    // In the meantime, it will use chargeVersion.changeReason.type === 'new_non_chargeable_charge_version'
    isChargeable: get(chargeVersion, 'changeReason.type') !== 'new_non_chargeable_charge_version'
  });
};

const getReviewChargeInformation = async (request, h) => {
  if (request.pre.draftChargeInformation.changeReason === null) {
    request.pre.draftChargeInformation = await preHandlers.loadChargeInformation(request);
    request.pre.billingAccount = await preHandlers.loadBillingAccount(request);
    request.pre.isChargeable = await preHandlers.loadIsChargeable(request);
  }

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
    if (request.payload.reviewOutcome === 'approve') {
      await services.water.chargeVersions.postCreateFromWorkflow(request.params.chargeVersionWorkflowId);
    } else {
      const patchObject = {
        status: request.payload.reviewOutcome,
        approverComments: request.payload.reviewerComments,
        chargeVersion: draftChargeInformation.chargeVersion
      };
      await services.water.chargeVersionWorkflows.patchChargeVersionWorkflow(
        request.params.chargeVersionWorkflowId,
        patchObject
      );
    }
    // Clear session
    request.clearDraftChargeInformation(licence.id);

    const document = await services.water.licences.getDocumentByLicenceId(licence.id, true);
    if (document.metadata.IsCurrent) {
      return h.redirect(`/licences/${document.document_id}#charge`);
    } else {
      // redirect to the licence expired page for future dated licences
      return h.redirect(`/expired-licences/${document.document_id}`);
    }
  }
};

exports.getViewChargeInformation = getViewChargeInformation;
exports.getReviewChargeInformation = getReviewChargeInformation;
exports.postReviewChargeInformation = postReviewChargeInformation;
