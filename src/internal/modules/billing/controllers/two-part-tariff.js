// TODO definition of error codes reqiured
const services = require('internal/lib/connectors/services');

const messages = {
  10: 'No returns submitted',
  20: 'Under query',
  30: 'Received',
  40: 'Some returns are due',
  50: 'Late returns',
  60: 'Over abstraction'
};

const getErrorString = errorCodes => errorCodes.reduce((acc, code) => {
  return acc ? 'Multiple errors' : messages[code];
}, null);

/**
 * Remove an invoice from the bill run
 * @param {*} request
 * @param {*} h
 */
const getTwoPartTariffReview = async (request, h) => {
  //   GET /water/1.0/billing/batches/{batchId}/licences
  const { batchId } = request.params;
  // get the invoice data
  const [ batch, licencesData ] = await Promise.all([
    services.water.billingBatches.getBatch(batchId),
    services.water.billingBatches.getBatchLicences(batchId)
  ]);

  // gets 2pt matching error messages and define error types
  const licences = licencesData.map(licence => ({
    ...licence,
    twoPartTariffStatuses: getErrorString(licence.twoPartTariffStatuses)
  }));

  // calculate total errors
  const totals = licences.reduce((acc, row) => ({
    errors: acc.errors + (row.twoPartTariffStatuses ? 1 : 0)
  }), { errors: 0 });

  // todo -- redirect if no errors

  return h.view('nunjucks/billing/two-part-tariff-review', {
    ...request.view,
    batch,
    licences,
    totals,
    back: `/billing/batch/list`
  });
};

module.exports.getTwoPartTariffReview = getTwoPartTariffReview;
