const titleCase = require('title-case');

const getBillingAccountCaption = billingAccount =>
  `Billing account ${billingAccount.accountNumber}`;

const getCurrentAddress = billingAccount =>
  billingAccount.invoiceAccountAddresses.find(accountAddress =>
    accountAddress.dateRange.endDate === null);

const getBillingAccount = (request, h) => {
  const { billingAccount } = request.pre;
  const { back } = request.query;
  return h.view('nunjucks/billing-accounts/view', {
    ...request.view,
    caption: getBillingAccountCaption(billingAccount),
    pageTitle: `Billing account for ${titleCase(billingAccount.company.name)}`,
    back,
    currentAddress: getCurrentAddress(billingAccount),
    billingAccount
  });
};

exports.getBillingAccount = getBillingAccount;
