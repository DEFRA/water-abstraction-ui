/**
 * Gets the correct route for the specified batch depending on its
 * current status
 * @param {Object} batch - the batch object from water service
 * @param {Boolean} isBackEnabled - whether back should be enabled on processing page
 * @param {Boolean} isErrorRoutesIncluded - whether to include error/empty batch routes
 * @return {String} the link
 */
const getBillingBatchRoute = (batch, isBackEnabled = true, isErrorRoutesIncluded = false) => {
  const { id } = batch;
  const links = {
    processing: `/billing/batch/${id}/processing?back=${isBackEnabled ? 1 : 0}`,
    ready: `/billing/batch/${id}/summary`,
    sent: `/billing/batch/${id}/summary`,
    review: `/billing/batch/${id}/two-part-tariff-review`
  };
  if (isErrorRoutesIncluded) {
    Object.assign(links, {
      error: `/billing/batch/${id}/processing`,
      empty: `/billing/batch/${id}/empty`
    });
  }
  return links[batch.status];
};

const getTwoPartTariffLicenceReviewRoute = (batch, invoiceLicenceId) =>
  `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicenceId}`;

exports.getBillingBatchRoute = getBillingBatchRoute;
exports.getTwoPartTariffLicenceReviewRoute = getTwoPartTariffLicenceReviewRoute;
