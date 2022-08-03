'use strict'

const Decimal = require('decimal.js-light')
const { sortBy, groupBy, pick, mapValues, isNull, get } = require('lodash')
const { sentenceCase } = require('shared/lib/string-formatter')
const routing = require('./routing')
const { transactionStatuses } = require('shared/lib/constants')
const agreementsMapper = require('shared/lib/mappers/agreements')
const numberFormatter = require('shared/lib/number-formatter')
const getBillCount = batch => [batch.invoiceCount, batch.creditNoteCount].reduce((acc, value) =>
  isNull(value) ? acc : (acc || 0) + value
, null)

/**
 * Maps a batch for the batch list view, adding the badge, batch type and
 * bill count
 * @param {Object} batch
 * @return {Object}
 */
const mapBatchListRow = batch => ({
  ...batch,
  batchType: mapBatchType(batch.type),
  billCount: getBillCount(batch),
  link: routing.getBillingBatchRoute(batch, { isBackEnabled: true })
})

const isTransactionInErrorStatus = transaction => transaction.status === transactionStatuses.error

const getTransactionTotals = transactions => {
  const hasErrors = transactions.some(isTransactionInErrorStatus)
  if (hasErrors) {
    return null
  }

  const initialValue = {
    debits: new Decimal(0),
    credits: new Decimal(0),
    netTotal: new Decimal(0)
  }

  const totals = transactions.reduce((acc, row) => ({
    debits: acc.debits.plus(row.isCredit ? 0 : row.value),
    credits: acc.credits.plus(row.isCredit ? row.value : 0),
    netTotal: acc.netTotal.plus(row.value)
  }), initialValue)

  return mapValues(totals, val => val.toNumber())
}

const getSortKey = trans => `${get(trans, 'chargeElement.id')}_${trans.isCompensationCharge ? 1 : 0}`

const getAdditionalCharges = transaction => {
  const additionalCharges = []
  if (transaction.supportedSourceName) {
    additionalCharges.push(`Supported source ${transaction.supportedSourceName} (${numberFormatter.formatCurrency(transaction.grossValuesCalculated.supportedSourceCharge, transaction.isCredit, true)})`)
  }
  if (transaction.isWaterCompanyCharge) {
    additionalCharges.push('Public Water Supply')
  }
  return additionalCharges.join(', ')
}

const getAdjustments = transaction => {
  const adjustments = []
  if (transaction.chargeElement?.adjustments?.aggregate) {
    adjustments.push(`Aggregate factor (${transaction.chargeElement.adjustments.aggregate})`)
  }
  if (transaction.chargeElement?.adjustments?.charge) {
    adjustments.push(`Adjustment factor (${transaction.chargeElement.adjustments.charge})`)
  }
  if (transaction.chargeElement?.adjustments?.s126) {
    adjustments.push(`Abatement factor (${transaction.chargeElement.adjustments.s126})`)
  }
  if (transaction.chargeElement?.adjustments?.s130) {
    adjustments.push('Canal and River Trust (0.5)')
  }
  if (transaction.chargeElement?.adjustments?.winter) {
    adjustments.push('Winter discount (0.5)')
  }
  return adjustments.join(', ')
}

const mapTransaction = trans => ({
  ...trans,
  agreements: trans.agreements.map(agreementsMapper.mapAgreement),
  adjustments: getAdjustments(trans),
  additionalCharges: getAdditionalCharges(trans)
})

const mapInvoiceLicence = (batch, invoice, invoiceLicence) => {
  const { licenceNumber, id: licenceId } = invoiceLicence.licence
  const { id, hasTransactionErrors, transactions } = invoiceLicence
  const deleteLink = isDeleteInvoiceLicenceLinkVisible(batch, invoice)
    ? `/billing/batch/${batch.id}/invoice/${invoice.id}/delete-licence/${invoiceLicence.id}`
    : null
  return {
    id,
    licenceNumber,
    hasTransactionErrors,
    transactions: sortBy(transactions, getSortKey).map(mapTransaction),
    totals: getTransactionTotals(transactions),
    links: {
      view: `/licences/${licenceId}`,
      delete: deleteLink
    }
  }
}

const isDeleteInvoiceLicenceLinkVisible = (batch, invoice) =>
  isReadyBatch(batch) &&
  !isRebilledInvoice(invoice) &&
  isInvoiceWithMultipleLicences(invoice)

const isReadyBatch = batch => batch.status === 'ready'

const isRebilledInvoice = invoice => invoice.rebillingState !== null

const isInvoiceWithMultipleLicences = invoice => invoice.invoiceLicences.length > 1

const mapBatchType = (type) => type === 'two_part_tariff' ? 'Two-part tariff' : sentenceCase(type)

const mapCondition = (conditionType, condition) => ({
  title: sentenceCase(conditionType.displayTitle.replace('Aggregate condition', '')),
  parameter1Label: conditionType.parameter1Label.replace('licence number', 'licence'),
  parameter1: condition.parameter1,
  parameter2Label: conditionType.parameter2Label,
  parameter2: condition.parameter2,
  text: condition.text
})

/**
 * Maps an array of conditions retrieved from licence summary water service call
 * to the shape necessary for display on the two part tariff transaction review screen
 * @param {Array} conditions - nested conditions
 * @return {Array} flat list ready for view
 */
const mapConditions = conditions => conditions.reduce((acc, conditionType) => {
  conditionType.points.forEach(point => {
    point.conditions.forEach(condition => {
      acc.push(mapCondition(conditionType, condition))
    })
  })
  return acc
}, [])

const mapInvoice = invoice => ({
  ...invoice,
  isCredit: invoice.netTotal < 0,
  group: invoice.isWaterUndertaker ? 'waterUndertakers' : 'otherAbstractors',
  sortValue: -Math.abs(invoice.netTotal)
})

const mapInvoices = (batch, invoices) => {
  const mappedInvoices = sortBy(invoices.map(mapInvoice), 'sortValue')
  return batch.type === 'annual' ? groupBy(mappedInvoices, 'group') : mappedInvoices
}

const mapInvoiceLevelErrors = invoice => invoice.invoiceLicences
  .filter(invoiceLicence => invoiceLicence.hasTransactionErrors)
  .map(invoiceLicence => ({
    id: invoiceLicence.id,
    message: `There are problems with transactions on licence ${invoiceLicence.licence.licenceNumber}`
  }))

const mapBatchLevelErrors = (batch, invoices) => invoices
  .filter(invoice => invoice.hasTransactionErrors)
  .map(invoice => ({
    link: `/billing/batch/${batch.id}/invoice/${invoice.id}`,
    ...pick(invoice, 'accountNumber', 'financialYearEnding')
  }))

const isCreditDebitBlockVisible = batch =>
  batch.source === 'wrls' && batch.type === 'supplementary'

exports.mapBatchListRow = mapBatchListRow
exports.mapInvoiceLicence = mapInvoiceLicence
exports.mapBatchType = mapBatchType
exports.mapConditions = mapConditions
exports.mapInvoices = mapInvoices
exports.mapInvoiceLevelErrors = mapInvoiceLevelErrors
exports.mapBatchLevelErrors = mapBatchLevelErrors
exports.isCreditDebitBlockVisible = isCreditDebitBlockVisible
