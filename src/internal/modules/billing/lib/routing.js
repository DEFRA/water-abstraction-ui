/**
 * Gets the correct route for the specified batch depending on its
 * current status
 * @param {Object} batch - the batch object from water service
 * @param {Object} options - whether back should be enabled on processing page
 *          {Boolean} isBackEnabled - whether back should be enabled on processing page
 *          {Boolean} isErrorRoutesIncluded - whether to include error/empty batch routes
 *          {Boolean} showSuccessPage - whether to show success or summary page for sent batch
 * @return {String} the link
 */
const getBillingBatchRoute = (batch, opts = {}) => {
  const { id } = batch;
  const links = {
    processing: `/billing/batch/${id}/processing?back=${opts.isBackEnabled ? 1 : 0}`,
    ready: `/billing/batch/${id}/summary`,
    sent: opts.showSuccessPage ? `/billing/batch/${id}/confirm/success` : `/billing/batch/${id}/summary`,
    review: `/billing/batch/${id}/two-part-tariff-review`
  };
  if (opts.isErrorRoutesIncluded) {
    Object.assign(links, {
      error: `/billing/batch/${id}/processing`,
      empty: `/billing/batch/${id}/empty`
    });
  }
  return links[batch.status];
};

const getTwoPartTariffLicenceReviewRoute = (batch, invoiceLicenceId) => {
  return `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicenceId}`;
};
exports.getBillingBatchRoute = getBillingBatchRoute;
exports.getTwoPartTariffLicenceReviewRoute = getTwoPartTariffLicenceReviewRoute;
