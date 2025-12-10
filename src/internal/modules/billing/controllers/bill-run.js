'use strict'

const { titleCase } = require('shared/lib/string-formatter')
const { pluralize } = require('shared/lib/pluralize')
const moment = require('moment')
const { get } = require('lodash')

const { cancelOrConfirmBatchForm } = require('../forms/cancel-or-confirm-batch')
const services = require('internal/lib/connectors/services')
const batchService = require('../services/batch-service')
const transactionsCSV = require('../services/transactions-csv')
const csv = require('internal/lib/csv-download')
const { logger } = require('internal/logger')
const mappers = require('../lib/mappers')
const { featureToggles, billRunsToDisplayPerPage } = require('../../../config')

const confirmForm = require('shared/lib/forms/confirm-form')

const getBillRunPageTitle = batch => `${batch.region.displayName} ${mappers.mapBatchType(batch.type).toLowerCase()} bill run`

const BATCH_LIST_ROUTE = '/system/bill-runs'

/**
 * Shows a batch with its list of invoices
 * together with their totals
 * @param {String} request.params.batchId
 */
const getBillingBatchSummary = async (request, h) => {
  const { batch } = request.pre

  const invoices = await services.water.billingBatches.getBatchInvoices(batch.id)

  return h.view('nunjucks/billing/batch-summary', {
    ...request.view,
    pageTitle: getBillRunPageTitle(batch),
    subHeading: `${invoices.length} ${mappers.mapBatchType(batch.type).toLowerCase()} ${pluralize('bill', invoices)}`,
    batch,
    invoices: mappers.mapInvoices(batch, invoices),
    isAnnual: batch.type === 'annual',
    isEditable: batch.status === 'ready',
    errors: mappers.mapBatchLevelErrors(batch, invoices),
    back: BATCH_LIST_ROUTE,
    backText: 'Go back to bill runs'
  })
}

const getCaption = invoice => invoice.invoiceNumber
  ? `Bill ${invoice.invoiceNumber}`
  : `Billing account ${invoice.invoiceAccount.accountNumber}`

const getOriginalInvoice = invoice => invoice.linkedInvoices.find(linkedInvoice => linkedInvoice.id === invoice.originalInvoiceId)

const getBillingBatchInvoice = async (request, h) => {
  const { batchId, invoiceId } = request.params

  const [batch, invoice] = await Promise.all([
    services.water.billingBatches.getBatch(batchId),
    services.water.billingBatches.getBatchInvoice(batchId, invoiceId)
  ])

  if (invoice.originalInvoiceId !== null) {
    invoice.originalInvoice = getOriginalInvoice(invoice)
  }
  const invoiceLicenceMapper = invoiceLicence => mappers.mapInvoiceLicence(batch, invoice, invoiceLicence)

  return h.view('nunjucks/billing/batch-invoice', {
    ...request.view,
    back: `/billing/batch/${batchId}/summary`,
    pageTitle: `Bill for ${titleCase(_billForName(invoice.invoiceAccount))}`,
    invoice,
    financialYearEnding: invoice.financialYear.yearEnding,
    batch,
    batchType: mappers.mapBatchType(batch.type),
    invoiceLicences: invoice.invoiceLicences.map(invoiceLicenceMapper),
    isCredit: get(invoice, 'totals.netTotal', 0) < 0,
    caption: getCaption(invoice),
    errors: mappers.mapInvoiceLevelErrors(invoice),
    isCreditDebitBlockVisible: mappers.isCreditDebitBlockVisible(batch),
    links: {
      billingAccount: `/billing-accounts/${invoice.invoiceAccount.id}`
    }
  })
}

const getBillingBatchList = async (request, h) => {
  const { page } = request.query
  const { data, pagination } = await batchService.getBatchList(page, billRunsToDisplayPerPage)
  const batches = data.map(mappers.mapBatchListRow)

  const billRunBuilding = batches.some((batch) => {
    return batch.status === 'processing' || batch.status === 'queued'
  })

  const billRunCancelling = batches.some((batch) => {
    return batch.status === 'cancel'
  })

  return h.view('nunjucks/billing/batch-list', {
    ...request.view,
    batches,
    billRunBuilding,
    billRunCancelling,
    pagination,
    form: featureToggles.deleteAllBillingData && confirmForm.form(request, 'Delete all bills and charge information', {
      action: '/billing/batch/delete-all-data',
      isWarning: true
    })
  })
}

const billingBatchAction = (request, h, action) => {
  const { batch } = request.pre
  const titleAction = (action === 'confirm') ? 'send' : 'cancel'
  return h.view('nunjucks/billing/confirm-batch', {
    ...request.view,
    batch,
    pageTitle: `You're about to ${titleAction} this bill run`,
    secondTitle: getBillRunPageTitle(batch),
    metadataType: 'batch',
    form: cancelOrConfirmBatchForm(request, action),
    back: `/billing/batch/${batch.id}/summary`
  })
}

const getBillingBatchCancel = async (request, h) => billingBatchAction(request, h, 'cancel')

const postBillingBatchCancel = async (request, h) => {
  const { batchId } = request.params

  try {
    await services.water.billingBatches.cancelBatch(batchId)
  } catch (err) {
    logger.info(`Did not successfully delete batch ${batchId}`)
  }

  return h.redirect(BATCH_LIST_ROUTE)
}

const getBillingBatchStatusToCancel = async (request, h) => billingBatchAction(request, h, 'cancel/processing-batch')

const postBillingBatchStatusToCancel = async (request, h) => {
  const { batchId } = request.params

  try {
    await services.water.billingBatches.setBatchStatusToError(batchId)
  } catch (err) {
    logger.info(`Did not successfully change batch ${batchId} status`)
  }

  return h.redirect(BATCH_LIST_ROUTE)
}

const getBillingBatchConfirm = async (request, h) => billingBatchAction(request, h, 'confirm')

const postBillingBatchConfirm = async (request, h) => {
  const { batchId } = request.params
  await services.water.billingBatches.approveBatch(batchId)
  return h.redirect(`/billing/batch/${batchId}/processing`)
}

const getBillingBatchConfirmSuccess = (request, h) => {
  const { batch } = request.pre
  return h.view('nunjucks/billing/batch-sent-success', {
    ...request.view,
    pageTitle: 'Bill run sent',
    panelText: `You've sent the ${getBillRunPageTitle(batch)} ${batch.billRunNumber}`,
    batch,
    featureToggles
  })
}

/**
 * allows user to download all the invoices, transactions, company,
 * licence and agreements data for a batch
 * @param {*} request
 * @param {*} h
 */
const getTransactionsCSV = async (request, h) => {
  const { batchId } = request.params
  const { invoices, chargeVersions } = await services.water.billingBatches.getBatchDownloadData(batchId)
  const csvData = transactionsCSV.createCSV(invoices, chargeVersions, request.pre.batch.scheme)
  const fileName = transactionsCSV.getCSVFileName(request.pre.batch)
  return csv.csvDownload(h, csvData, fileName)
}

/**
 * Remove an invoice from the bill run
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchDeleteInvoice = async (request, h) => {
  const { batchId } = request.params
  const { batch, invoice } = request.pre
  const { originalInvoiceId, rebillInvoiceId } = request.query
  const batchType = mappers.mapBatchType(batch.type).toLowerCase()
  const formText = { title: '', button: '' }
  if (invoice.rebillingState !== null) {
    formText.title = `You're about to cancel the reissue of ${getOriginalInvoice(invoice).displayLabel}`
    formText.button = 'Cancel this reissue'
  } else {
    formText.title = `You're about to remove this bill from the ${batchType} bill run`
    formText.button = 'Remove this bill'
  }

  const options = {
    originalInvoiceId,
    rebillInvoiceId
  }

  return h.view('nunjucks/billing/confirm-invoice', {
    ...request.view,
    pageTitle: formText.title,
    batch,
    invoice,
    form: confirmForm.form(request, formText.button, options),
    metadataType: 'invoice',
    back: `/billing/batch/${batchId}/summary`
  })
}

const postBillingBatchDeleteInvoice = async (request, h) => {
  const { batchId, invoiceId } = request.params
  const { originalInvoiceId, rebillInvoiceId } = request.payload

  await services.water.billingBatches.deleteInvoiceFromBatch(batchId, invoiceId, originalInvoiceId, rebillInvoiceId)
  return h.redirect(`/billing/batch/${batchId}/summary`)
}

/**
 * Renders a 'waiting' page while the batch is processing.
 *
 * The redirectOnBatchStatus pre handler will have already redirected to the appropriate page
 * if the batch is processed.
 *
 * @param {Object} request.pre.batch - billing batch loaded by pre handler
 * @param {Number} request.query.back - whether to render back button
 */
const getBillingBatchProcessing = async (request, h) => {
  const { batch } = request.pre

  return h.view('nunjucks/billing/batch-processing', {
    batch,
    ...request.view,
    caption: moment(batch.createdAt).format('D MMMM YYYY'),
    pageTitle: `${batch.region.displayName} ${mappers.mapBatchType(batch.type).toLowerCase()} bill run`
  })
}

/**
 * Renders an error page if the batch is empty - i.e. no transactions
 * @param {Object} request.pre.batch - billing batch loaded by pre handler
 */
const getBillingBatchEmpty = async (request, h) => {
  const { batch } = request.pre

  return h.view('nunjucks/billing/batch-empty', {
    ...request.view,
    pageTitle: getBillRunPageTitle(batch),
    batch,
    back: BATCH_LIST_ROUTE
  })
}

/**
 * Renders an error page if the batch is errored - i.e. the charging module is down
 * @param {Object} request.pre.batch - billing batch loaded by pre handler
 */
const getBillingBatchError = async (request, h) => {
  const { batch } = request.pre

  return h.view('nunjucks/billing/batch-error', {
    ...request.view,
    pageTitle: getBillRunPageTitle(batch),
    batch,
    back: BATCH_LIST_ROUTE,
    errorList: _errorList(batch.errorCode)
  })
}

const _errorList = (errorCode) => {
  if (!errorCode) {
    return [{ text: 'No error code was assigned. We have no further information at this time.' }]
  }

  const errors = [
    { code: 10, text: 'Error when populating the charge versions.' },
    { code: 20, text: 'Error when processing the charge versions.' },
    { code: 30, text: 'Error when preparing the transactions.' },
    { code: 40, text: 'Error when requesting or processing a transaction charge.' },
    { code: 50, text: 'Error when creating the Charging Module bill run.' },
    { code: 60, text: 'Error when deleting an invoice.' },
    { code: 70, text: 'Error when processing two-part tariff.' },
    { code: 80, text: 'Error when getting the Charging Module bill run summary.' },
    { code: 90, text: 'Error when re-billing a bill run.' }
  ]

  const error = errors.find((error) => {
    return error.code === errorCode
  })

  return [{ text: error.text }]
}

/**
 * Deletes all billing data
 */
const postDeleteAllBillingData = async (request, h) => {
  await services.water.billingBatches.deleteAllBillingData()
  return h.redirect(BATCH_LIST_ROUTE)
}

function _billForName (invoiceAccount) {
  let result = invoiceAccount.company.name

  if (invoiceAccount.invoiceAccountAddresses) {
    invoiceAccount.invoiceAccountAddresses.sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })

    if (invoiceAccount.invoiceAccountAddresses[0]?.agentCompany?.name) {
      result = invoiceAccount.invoiceAccountAddresses[0]?.agentCompany?.name
    }
  }

  return result
}

module.exports = {
  getBillingBatchList,
  getBillingBatchSummary,
  getBillingBatchInvoice,
  getBillingBatchCancel,
  postBillingBatchCancel,
  getBillingBatchConfirm,
  postBillingBatchConfirm,
  getBillingBatchConfirmSuccess,
  getBillingBatchDeleteInvoice,
  postBillingBatchDeleteInvoice,
  getTransactionsCSV,
  getBillingBatchProcessing,
  getBillingBatchEmpty,
  getBillingBatchError,
  postDeleteAllBillingData,
  getBillingBatchStatusToCancel,
  postBillingBatchStatusToCancel
}
