'use strict'

const Boom = require('@hapi/boom')
const { get, sortBy } = require('lodash')
const { water } = require('../../lib/connectors/services')

const session = require('./lib/session')
const rebillingStore = require('./lib/rebilling/store')

const errorHandler = (err, message) => {
  if (err.statusCode === 404) {
    return Boom.notFound(message)
  }
  throw err
}

const loadBillingAccount = async request => {
  const { billingAccountId } = request.params
  try {
    return water.invoiceAccounts.getInvoiceAccount(billingAccountId)
  } catch (err) {
    return errorHandler(err, `Cannot load billing account ${billingAccountId}`)
  }
}

const getSessionDataFromRequest = request => {
  const { key } = request.params
  return session.get(request, key)
}

const getSessionData = request => {
  const data = getSessionDataFromRequest(request)
  return data || Boom.notFound(`Session data not found for ${request.params.key}`)
}

const getBillingAccounts = async request => {
  const { key } = request.params
  const { companyId, regionId } = session.get(request, key)

  try {
    const { data } = await water.companies.getCompanyInvoiceAccounts(companyId, regionId)
    return data
  } catch (err) {
    return errorHandler(err, `Cannot load billing accounts for company ${companyId}`)
  }
}

/**
 * Gets the "company" account
 */
const getAccount = async request => {
  const { key } = request.params
  const { companyId } = session.get(request, key)
  return water.companies.getCompany(companyId)
}

/**
 * Get licences currently linked to the billing account
 */
const getBillingAccountLicences = async request => {
  const { id } = get(request, 'pre.sessionData.data')
  if (id) {
    const { data } = await water.invoiceAccounts.getLicences(id)
    return data
  }
  return []
}

/**
 * Get sent invoices for the billing account
 * @return {Promise<Object>} { data, pagination }
 */
const getBillingAccountBills = request => {
  const { billingAccountId } = request.params
  const { page = 1, perPage = 10 } = request.query
  return water.invoiceAccounts.getInvoiceAccountInvoices(billingAccountId, page, perPage)
}

/**
 * Checks if bill is rebillable
 * @param {Object} bill
 * @returns {Boolean}
 */
const isRebillableBill = bill =>
  (bill.batch.source === 'wrls') &&
  !bill.isDeMinimis &&
  (bill.netTotal !== 0) &&
  ['rebill', null].includes(bill.rebillingState)

/**
 * Gets a list of bills which can be re-billed for the current billing account
 * @return {Promise<Array>}
 */
const getBillingAccountRebillableBills = async request => {
  const { billingAccountId } = request.params
  const { data } = await water.invoiceAccounts.getInvoiceAccountInvoices(billingAccountId, 1, Number.MAX_SAFE_INTEGER)
  return sortBy(
    data.filter(isRebillableBill),
    bill => bill.invoiceNumber
  )
}

exports.loadBillingAccount = loadBillingAccount
exports.getSessionData = getSessionData
exports.getBillingAccounts = getBillingAccounts
exports.getAccount = getAccount
exports.getBillingAccountLicences = getBillingAccountLicences
exports.getBillingAccountBills = getBillingAccountBills
exports.getBillingAccountRebillableBills = getBillingAccountRebillableBills
exports.getRebillingState = rebillingStore.getState
