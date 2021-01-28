'use strict';

const titleCase = require('title-case');

const getBillingAccountCaption = billingAccount =>
  `Billing account ${billingAccount.accountNumber}`;

const getCurrentAddress = billingAccount =>
  billingAccount.invoiceAccountAddresses.find(accountAddress =>
    accountAddress.dateRange.endDate === null);

const getBillingAccountRedirectLink = request => {
  const { billingAccountId } = request.params;
  const { billingAccount } = request.pre;

  const data = {
    caption: `Billing account ${billingAccount.accountNumber}`,
    key: `change-address-${billingAccountId}`,
    back: `/billing-accounts/${billingAccountId}`,
    redirectPath: `/billing-accounts/${billingAccountId}`,
    isUpdate: true,
    data: billingAccount
  };
  return request.billingAccountEntryRedirect(data);
};

const getBillingAccount = (request, h) => {
  const { billingAccount } = request.pre;
  const { back } = request.query;

  return h.view('nunjucks/billing-accounts/view', {
    ...request.view,
    caption: getBillingAccountCaption(billingAccount),
    pageTitle: `Billing account for ${titleCase(billingAccount.company.name)}`,
    back,
    currentAddress: getCurrentAddress(billingAccount),
    billingAccount,
    changeAddressLink: getBillingAccountRedirectLink(request)
  });
};

exports.getBillingAccount = getBillingAccount;
