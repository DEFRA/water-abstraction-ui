'use strict'

/**
 * Gets the correct route for the specified batch depending on its
 * current status
 *
 * @param {Object} batch - the batch object from water service
 * @param {Object} options - whether to show the success page or batch summary ({Boolean} showSuccessPage). Whether to
 * redirect to the bill page when the batch status becomes 'ready' ({String} invoiceId)
 *
 * @return {String} the link
 */
const getBillingBatchRoute = (batch, opts = {}) => {
  const { id, scheme, status } = batch

  if (status === 'cancel') {
    return null
  }

  if (status === 'processing' || status === 'queued' || status === 'sending') {
    return `/billing/batch/${id}/processing`
  }

  if (opts.invoiceId && status === 'ready') {
    return `/system/bills/${opts.invoiceId}`
  }

  if (opts.showSuccessPage && status === 'sent') {
    return `/billing/batch/${id}/confirm/success`
  }

  if (status === 'review') {
    if (scheme === 'sroc') {
      return `/system/bill-runs/${id}/review`
    }

    return `/billing/batch/${id}/two-part-tariff-review`
  }

  return `/system/bill-runs/${id}`
}

const getTwoPartTariffLicenceReviewRoute = (batch, invoiceLicenceId) =>
  `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicenceId}`

exports.getBillingBatchRoute = getBillingBatchRoute
exports.getTwoPartTariffLicenceReviewRoute = getTwoPartTariffLicenceReviewRoute
