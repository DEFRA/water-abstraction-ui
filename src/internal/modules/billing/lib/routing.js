'use strict'

const { featureToggles } = require('../../../config.js')

/**
 * Gets the correct route for the specified batch depending on its
 * current status
 * @param {Object} batch - the batch object from water service
 * @param {Object} options - whether back should be enabled on processing page
 *          {Boolean} isBackEnabled - whether back should be enabled on processing page
 *          {Boolean} showSuccessPage - whether to show success or summary page for sent batch
 *          {String} invoiceId - set if user should be redirected to invoice page when batch ready
 * @return {String} the link
 */
const getBillingBatchRoute = (batch, opts = {}) => {
  const { id, scheme, status } = batch

  if (status === 'processing' || status === 'queued' || status === 'sending') {
    return `/billing/batch/${id}/processing?back=${opts.isBackEnabled ? 1 : 0}`
  }

  if (status === 'ready') {
    if (opts.invoiceId) {
      return `/billing/batch/${id}/invoice/${opts.invoiceId}`
    }

    if (featureToggles.useNewBillView) {
      return `/system/bill-runs/${id}`
    }

    return `/billing/batch/${id}/summary`
  }

  if (status === 'sent') {
    if (opts.showSuccessPage) {
      return `/billing/batch/${id}/confirm/success`
    }

    if (featureToggles.useNewBillView) {
      return `/system/bill-runs/${id}`
    }

    return `/billing/batch/${id}/summary`
  }

  if (status === 'review') {
    if (scheme === 'sroc') {
      return `/system/bill-runs/${id}/review`
    }

    return `/billing/batch/${id}/two-part-tariff-review`
  }

  return `/billing/batch/${id}/${status}`
}

const getTwoPartTariffLicenceReviewRoute = (batch, invoiceLicenceId) =>
  `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicenceId}`

exports.getBillingBatchRoute = getBillingBatchRoute
exports.getTwoPartTariffLicenceReviewRoute = getTwoPartTariffLicenceReviewRoute
