const {
  getDefaultView,
  getLicencePageUrl,
  findInvoiceAccountAddress
} = require('../lib/helpers');
const chargeInformationValidator = require('../lib/charge-information-validator');
const { chargeVersionWorkflowReviewer } = require('internal/lib/constants').scope;
const { hasScope } = require('internal/lib/permissions');
const moment = require('moment');

const formatDateForPageTitle = startDate =>
  moment(startDate).format('D MMMM YYYY');

const getViewChargeInformation = async (request, h) => {
  const { chargeVersion, licence } = request.pre;
  const backLink = await getLicencePageUrl(licence);

  return h.view('nunjucks/charge-information/view', {
    ...getDefaultView(request, backLink),
    pageTitle: `Charge information valid from ${formatDateForPageTitle(chargeVersion.dateRange.startDate)}`,
    chargeVersion,
    isEditable: false,
    // @TODO: use request.pre.isChargeable to determine this
    // after the chargeVersion import ticket has been completed
    isChargeable: true
  });
};

const getReviewChargeInformation = async (request, h) => {
  const { draftChargeInformation, licence, isChargeable } = request.pre;
  const backLink = await getLicencePageUrl(licence);
  const isEditable = hasScope(request, chargeVersionWorkflowReviewer);
  const invoiceAccountAddress = findInvoiceAccountAddress(request);

  return h.view('nunjucks/charge-information/view', {
    ...getDefaultView(request, backLink),
    pageTitle: `Check charge information`,
    chargeVersion: chargeInformationValidator.addValidation(draftChargeInformation),
    invoiceAccountAddress,
    licenceId: licence.id,
    isEditable,
    isChargeable
  });
};

exports.getReviewChargeInformation = getReviewChargeInformation;
exports.getViewChargeInformation = getViewChargeInformation;
