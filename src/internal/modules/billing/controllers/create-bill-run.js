const { kebabCase, partialRight, snakeCase } = require('lodash');
const urlJoin = require('url-join');

const forms = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');

const { selectBillingTypeForm, billingTypeFormSchema } = require('../forms/billing-type');
const { selectBillingRegionForm, billingRegionFormSchema } = require('../forms/billing-region');
const { TWO_PART_TARIFF } = require('../lib/bill-run-types');
const seasons = require('../lib/seasons');
const routing = require('../lib/routing');
const sessionForms = require('shared/lib/session-forms');
const { getBatchFinancialYearEnding } = require('../lib/batch-financial-year');
const { water } = require('internal/lib/connectors/services');

/**
 * Step 1a of create billing batch flow - display form to select type
 * i.e. Annual, Supplementary, Two-Part Tariff
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchType = async (request, h) => {
  return h.view('nunjucks/form', {
    ...request.view,
    back: '/manage',
    form: sessionForms.get(request, selectBillingTypeForm(request))
  });
};

/**
 * Step 1b - receive posted step 1a data
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchType = async (request, h) => {
  const billingTypeForm = forms.handleRequest(selectBillingTypeForm(request), request, billingTypeFormSchema(request));

  if (billingTypeForm.isValid) {
    const { selectedBillingType, twoPartTariffSeason } = forms.getValues(billingTypeForm);
    return h.redirect(_regionUrl(
      selectedBillingType,
      selectedBillingType === TWO_PART_TARIFF ? twoPartTariffSeason : ''
    ));
  }

  return h.postRedirectGet(billingTypeForm);
};

/**
 * Step 2a - display select region form
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchRegion = async (request, h) => {
  const { regions } = request.pre;

  return h.view('nunjucks/form', {
    ...request.view,
    back: '/billing/batch/type',
    form: sessionForms.get(request, selectBillingRegionForm(request, regions))
  });
};

/**
 * Step 2b received step 2a posted data
 * try to create a new billing run batch
 * redirect to waiting page
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchRegion = async (request, h, refDate) => {
  const { regions } = request.pre;
  const schema = billingRegionFormSchema(regions);
  const billingRegionForm = forms.handleRequest(selectBillingRegionForm(request, regions), request, schema);

  const { selectedBillingType, selectedTwoPartTariffSeason, selectedBillingRegion } = forms.getValues(billingRegionForm);

  if (!billingRegionForm.isValid) {
    const path = _regionUrl(selectedBillingType, selectedTwoPartTariffSeason);
    return h.postRedirectGet(billingRegionForm, path);
  }

  if (selectedBillingType !== TWO_PART_TARIFF) {
    const batch = _batchDetails(request, billingRegionForm);
    return _batching(h, batch);
  }

  const isSummer = selectedTwoPartTariffSeason === seasons.SUMMER;
  const body = {
    userEmail: request.defra.user.user_name,
    regionId: selectedBillingRegion,
    currentFinancialYear: getBatchFinancialYearEnding(selectedBillingType, isSummer, Date.now()),
    isSummer
  };

  const billableYears = await water.billingBatches.getBatchBillableYears(body);

  if (billableYears.unsentYears.length > 1) {
    const path = _financialYearUrl(selectedBillingType, selectedTwoPartTariffSeason, selectedBillingRegion);
    //  TF
    return h.postRedirectGet('', path);
  } else {
    const batch = _batchDetails(request, billingRegionForm);
    return _batching(h, batch);
  }
};

const getBillingBatchFinancialYear = async (request, h, error) => {
  const selectedBillingType = snakeCase(request.params.billingType);
  const isSummer = request.params.season === seasons.SUMMER;
  const currentFinancialYear = getBatchFinancialYearEnding(selectedBillingType, isSummer, Date.now());

  const body = {
    userEmail: request.defra.user.user_name,
    regionId: request.params.region,
    currentFinancialYear,
    isSummer
  };
  const billableYears = await water.billingBatches.getBatchBillableYears(body);

  const items = billableYears.unsentYears.map(unsentYear => {
    const hint = unsentYear === currentFinancialYear ? { text: 'current year' } : null;
    return {
      value: unsentYear,
      text: `${unsentYear - 1} to ${unsentYear}`,
      hint
    };
  });

  const viewError = {};
  if (request.query.error) {
    viewError.error = true;
    viewError.errorList = [
      {
        text: 'You need to select the financial year',
        href: '#select-financial-year'
      }
    ];
    viewError.errorMessage = {
      text: 'You need to select the financial year'
    };
  }

  return h.view(
    'nunjucks/billing/batch-two-part-tariff-billable-years.njk',
    {
      ...request.view,
      back: `/billing/batch/region/${request.params.billingType}/${request.params.season}`,
      items,
      ...viewError
    }
  );
};

const postBillingBatchFinancialYear = async (request, h) => {
  if (!request.payload['select-financial-year']) {
    return h.redirect(`/billing/batch/financial-year/${request.params.billingType}/${request.params.season}/${request.params.region}?error=true`);
  }

  const batch = {
    userEmail: request.defra.user.user_name,
    regionId: request.params.region,
    batchType: snakeCase(request.params.billingType),
    financialYearEnding: request.payload['select-financial-year'],
    isSummer: request.params.season === seasons.SUMMER
  };

  return _batching(h, batch);
};

const getBillingBatchCreationError = async (request, h, error) => {
  const { batch } = request.pre;
  return h.view('nunjucks/billing/batch-creation-error', {
    ...request.view,
    ..._creationErrorText(error, batch),
    back: '/billing/batch/region',
    batch: batch
  });
};

const _batching = async (h, batch) => {
  try {
    const { data } = await services.water.billingBatches.createBillingBatch(batch);
    const path = routing.getBillingBatchRoute(data.batch, { isBackEnabled: false });
    console.log('I am not ready to be watched!!');
    return h.redirect(path);
  } catch (err) {
    if (err.statusCode === 409) {
      return h.redirect(_batchCreationErrorRedirectPath(err));
    }
    throw err;
  }
};

const _batchCreationErrorRedirectPath = err => {
  const { batch } = err.error;
  if (batch.status === 'sent') {
    return `/billing/batch/${batch.id}/duplicate`;
  }
  return `/billing/batch/${batch.id}/exists`;
};

const _batchDetails = (request, billingRegionForm, refDate = null) => {
  const {
    selectedBillingType,
    selectedBillingRegion,
    selectedTwoPartTariffSeason
  } = forms.getValues(billingRegionForm);

  const isSummer = selectedTwoPartTariffSeason === seasons.SUMMER;

  let financialYearEnding;
  if (refDate) {
    financialYearEnding = refDate;
  } else {
    financialYearEnding = getBatchFinancialYearEnding(selectedBillingType, isSummer, Date.now());
  }
  // const financialYearEnding = getBatchFinancialYearEnding(selectedBillingType, isSummer, refDate);

  const batch = {
    userEmail: request.defra.user.user_name,
    regionId: selectedBillingRegion,
    batchType: selectedBillingType,
    financialYearEnding,
    isSummer: selectedTwoPartTariffSeason === seasons.SUMMER
  };
  return batch;
};

const _creationErrorText = (error, batch) => {
  const creationErrorText = {
    liveBatchExists: {
      pageTitle: 'There is already a bill run in progress for this region',
      warningMessage: 'You need to confirm or cancel this bill run before you can create a new one'
    },
    duplicateSentBatch: {
      pageTitle: `This bill run type has already been processed for ${batch.endYear.yearEnding}`,
      warningMessage: 'You can only have one of this bill run type for a region in a financial year'
    }
  };
  return creationErrorText[error];
};

const _financialYearUrl = (selectedBillingType, selectedTwoPartTariffSeason, selectedBillingRegion) => urlJoin(
  '/billing/batch/financial-year',
  kebabCase(selectedBillingType),
  kebabCase(selectedTwoPartTariffSeason),
  selectedBillingRegion
);

const _regionUrl = (selectedBillingType, selectedTwoPartTariffSeason) => urlJoin(
  '/billing/batch/region',
  kebabCase(selectedBillingType),
  kebabCase(selectedTwoPartTariffSeason)
);

/**
 * If a bill run for the region exists, then display a basic summary page
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchExists = partialRight(getBillingBatchCreationError, 'liveBatchExists');

/**
 * If the bill run type for the region, year and season has already been run, then display a basic summary page
 *    Annual and TPT bill runs can only be run once per region, financial year and season
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchDuplicate = partialRight(getBillingBatchCreationError, 'duplicateSentBatch');

exports.getBillingBatchType = getBillingBatchType;
exports.postBillingBatchType = postBillingBatchType;

exports.getBillingBatchRegion = getBillingBatchRegion;
exports.postBillingBatchRegion = postBillingBatchRegion;

exports.getBillingBatchExists = getBillingBatchExists;
exports.getBillingBatchDuplicate = getBillingBatchDuplicate;

exports.getBillingBatchFinancialYear = getBillingBatchFinancialYear;
exports.postBillingBatchFinancialYear = postBillingBatchFinancialYear;
