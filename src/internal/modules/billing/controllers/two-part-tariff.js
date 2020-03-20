// two part tariff billing controller methods to go here
/**
 * Remove an invoice from the bill run
 * @param {*} request
 * @param {*} h
 */
const getTwoPartTariffReview = async (request, h) => {
  //   GET /water/1.0/billing/batches/{batchId}/licences
  const { batchId } = request.params;
  // [{   invoiceLicenceId :  ‘guid-here',   licenceNumber: ‘01/23’,   licenceHolder: ‘Lord Potato’,   twoPartTariffErrors:  [100, 200, 300]}]
  /* not found, 404 error

    empty status, returns empty array

    if status is review or ready, return data in array

    otherwise - determine and return suitable error code. */

  return h.view('nunjucks/billing/two-part-tariff-review', {
    ...request.view,
    batchId,
    batch: { status: 'review' },
    back: `/billing/batch/${batchId}/summary`
  });
};

module.exports.getTwoPartTariffReview = getTwoPartTariffReview;
