const services = require('internal/lib/connectors/services');

const messages = {
  10: 'No returns submitted',
  20: 'Under query',
  30: 'Received',
  40: 'Some returns are due',
  50: 'Late returns',
  60: 'Over abstraction'
};

const getTotals = licences => {
  const initVals = {
    ready: 0,
    errors: 0,
    total: 0
  };
  const totalErrors = licences.reduce((acc, row) => ({
    errors: acc.errors + (row.twoPartTariffStatuses.length > 0 ? 1 : 0)
  }), initVals);

  const totals = {
    ...totalErrors,
    ready: licences.length - totalErrors.errors,
    total: licences.length
  };
  return totals;
};

const getErrorString = errorCodes => errorCodes.reduce((acc, code) => {
  return acc ? 'Multiple errors' : messages[code];
}, null);

const getTwoPartTariffAction = async (request, h, action) => {
  const { batch } = request.pre;
  const licencesData = await services.water.billingBatches.getBatchLicences(batch.id);
  // gets 2pt matching error messages and define error types
  const licences = licencesData.map(licence => ({
    ...licence,
    twoPartTariffStatuses: getErrorString(licence.twoPartTariffStatuses)
  }));

  return h.view('nunjucks/billing/two-part-tariff-' + action, {
    ...request.view,
    batch,
    licences,
    totals: getTotals(licencesData),
    back: `/billing/batch/list`
  });
};

const getTwoPartTariffReview = async (request, h, action) => getTwoPartTariffAction(request, h, 'review');
const getTwoPartTariffViewReady = async (request, h) => getTwoPartTariffAction(request, h, 'ready');

module.exports.getTwoPartTariffReview = getTwoPartTariffReview;
module.exports.getTwoPartTariffViewReady = getTwoPartTariffViewReady;
