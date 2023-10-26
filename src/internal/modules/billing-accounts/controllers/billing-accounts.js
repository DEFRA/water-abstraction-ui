'use strict'

const { pick } = require('lodash')
const { titleCase } = require('shared/lib/string-formatter')
const { getCurrentAddress, generateBillingAccountMetadata } = require('../lib/helpers')

const { featureToggles } = require('../../../config.js')

const getBillingAccountCaption = billingAccount =>
  `Billing account ${billingAccount.accountNumber}`

const getBillingAccountRedirectLink = request => {
  const { billingAccountId } = request.params
  const { billingAccount } = request.pre

  const data = {
    caption: `Billing account ${billingAccount.accountNumber}`,
    key: `change-address-${billingAccountId}`,
    back: `/billing-accounts/${billingAccountId}`,
    redirectPath: `/billing-accounts/${billingAccountId}`,
    isUpdate: true,
    data: pick(billingAccount, 'id', 'company')
  }

  return request.billingAccountEntryRedirect(data)
}

/**
 * View billing account
 */
const getBillingAccount = (request, h) => {
  const { billingAccountId } = request.params
  const { billingAccount, bills, rebillableBills } = request.pre
  const { back } = request.query

  const moreBillsLink = (bills.pagination.pageCount > 1) &&
    `/billing-accounts/${billingAccountId}/bills`

  const metadataHtml = generateBillingAccountMetadata(billingAccount)

  return h.view('nunjucks/billing-accounts/view', {
    ...request.view,
    caption: getBillingAccountCaption(billingAccount),
    pageTitle: `Billing account for ${titleCase(billingAccount.company.name)}`,
    back,
    currentAddress: getCurrentAddress(billingAccount),
    billingAccount,
    changeAddressLink: getBillingAccountRedirectLink(request),
    bills: bills.data,
    moreBillsLink,
    rebillingLink: `/billing-accounts/${billingAccountId}/rebilling`,
    rebillable: rebillableBills.length > 0,
    metadataHtml,
    useNewBillView: featureToggles.useNewBillView
  })
}

/**
 * View all bills for billing account
 */
const getBillingAccountBills = (request, h) => {
  const { billingAccountId } = request.params
  const { billingAccount, bills: { data: bills, pagination } } = request.pre

  return h.view('nunjucks/billing-accounts/view-bills', {
    ...request.view,
    caption: getBillingAccountCaption(billingAccount),
    pageTitle: `Sent bills for ${titleCase(billingAccount.company.name)}`,
    back: `/billing-accounts/${billingAccountId}`,
    bills,
    pagination,
    path: request.path,
    useNewBillView: featureToggles.useNewBillView
  })
}

exports.getBillingAccount = getBillingAccount
exports.getBillingAccountBills = getBillingAccountBills
