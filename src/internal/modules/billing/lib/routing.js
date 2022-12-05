/**
 * Gets the correct route for the specified batch depending on its
 * current status
 * @param {Object} batch - the batch object from water service
 * @param {Object} options - whether back should be enabled on processing page
 *          {Boolean} isBackEnabled - whether back should be enabled on processing page
 *          {Boolean} isErrorRoutesIncluded - whether to include error/empty batch routes
 *          {Boolean} showSuccessPage - whether to show success or summary page for sent batch
 *          {String} invoiceId - set if user should be redirected to invoice page when batch ready
 * @return {String} the link
 */
const getBillingBatchRoute = (batch, opts = {}) => {
  const { id, batchType, scheme } = batch

  const routeMap = new Map()
    .set('processing', `/billing/batch/${id}/processing?back=${opts.isBackEnabled ? 1 : 0}`)
    .set('sending', `/billing/batch/${id}/processing?back=${opts.isBackEnabled ? 1 : 0}`)
    .set('ready', _determineReadyUrl(opts, id, batchType, scheme))
    .set('sent', opts.showSuccessPage ? `/billing/batch/${id}/confirm/success` : `/billing/batch/${id}/summary`)
    .set('review', `/billing/batch/${id}/two-part-tariff-review`)

  if (opts.isErrorRoutesIncluded) {
    routeMap
      .set('error', `/billing/batch/${id}/processing`)
      .set('empty', `/billing/batch/${id}/empty`)
  }

  return routeMap.get(batch.status)
}

function _determineReadyUrl (opts, id, batchType, scheme) {
  if (opts.invoiceId) {
    return `/billing/batch/${id}/invoice/${opts.invoiceId}`
  }

  if (batchType === 'supplementary' && scheme === 'presroc') {
    return '/SROC/SUPPLEMENTARY'
  }

  return `/billing/batch/${id}/summary`
}

const getTwoPartTariffLicenceReviewRoute = (batch, invoiceLicenceId) =>
  `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicenceId}`

exports.getBillingBatchRoute = getBillingBatchRoute
exports.getTwoPartTariffLicenceReviewRoute = getTwoPartTariffLicenceReviewRoute
