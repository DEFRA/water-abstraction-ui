'use strict';

const titleCase = require('title-case');
const { getValues } = require('shared/lib/forms');
const { handleFormRequest } = require('shared/lib/form-handler');
const session = require('../lib/rebilling/session');
const mappers = require('../lib/rebilling/mappers');

const forms = {
  dateFrom: require('../forms/rebilling-date-from'),
  confirm: require('shared/lib/forms/confirm-form')
};

/**
 * Enter the start date for re-billing
 */
const getRebillingStartDate = async (request, h) => h.view('nunjucks/form', {
  ...request.view,
  back: `/billing-accounts/${request.params.billingAccountId}`,
  form: handleFormRequest(request, forms.dateFrom),
  pageTitle: 'What date do you need to reissue a bill from?'
});

/**
 * Post handler for start date form
 */
const postRebillingStartDate = async (request, h) => {
  const form = handleFormRequest(request, forms.dateFrom);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  // Update session
  const { fromDate } = getValues(form);
  session.setDateFrom(request, fromDate);

  // Redirect to check answers
  const { billingAccountId } = request.params;
  return h.redirect(`/billing-accounts/${billingAccountId}/rebilling/check-answers`);
};

const getCheckAnswersPageTitle = request => {
  const { billingAccount } = request.pre;
  const { selectedBillIds } = session.getData(request);
  const pageTitlePrefix = selectedBillIds.length === 1
    ? `There is 1 bill`
    : `There are ${selectedBillIds.length} bills`;

  return `${pageTitlePrefix} available for reissue to ${titleCase(billingAccount.company.name)}`;
};

const getSelectedBills = request => {
  const { selectedBillIds } = session.getData(request);
  return request.pre.rebillableBills
    .map(mappers.mapBill)
    .filter(bill => selectedBillIds.includes(bill.id));
};

/**
 * Check answers page
 */
const getCheckAnswers = (request, h) => {
  const { billingAccount } = request.pre;
  const { billingAccountId } = request.params;
  const { fromDate } = session.getData(request);

  return h.view('nunjucks/billing-accounts/rebilling-check-answers', {
    ...request.view,
    back: `/billing-accounts/${request.params.billingAccountId}/rebilling`,
    form: forms.confirm.form(request),
    fromDate,
    bills: getSelectedBills(request),
    pageTitle: getCheckAnswersPageTitle(request),
    caption: `Billing account ${billingAccount.accountNumber}`,
    links: {
      changeDate: `/billing-accounts/${billingAccountId}/rebilling`,
      selectBills: `/billing-accounts/${billingAccountId}/rebilling/select-bills`
    }
  });
};

const postCheckAnswers = (request, h) => {

};

exports.getRebillingStartDate = getRebillingStartDate;
exports.postRebillingStartDate = postRebillingStartDate;

exports.getCheckAnswers = getCheckAnswers;
exports.postCheckAnswers = postCheckAnswers;
