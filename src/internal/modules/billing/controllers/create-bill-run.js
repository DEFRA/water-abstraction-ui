const { kebabCase, partialRight, snakeCase } = require('lodash');
const urlJoin = require('url-join');
const queryString = require('querystring');

const forms = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');

const { selectBillingTypeForm, billingTypeFormSchema } = require('../forms/billing-type');
const { selectBillingRegionForm, billingRegionFormSchema } = require('../forms/billing-region');
const { selectBillingFinancialYearsForm, billingFinancialYearsFormSchema } = require('../forms/financial-years');
const { TWO_PART_TARIFF } = require('../lib/bill-run-types');
const seasons = require('../lib/seasons');
const routing = require('../lib/routing');
const sessionForms = require('shared/lib/session-forms');
const { getBatchFinancialYearEnding } = require('../lib/batch-financial-year');
const { water } = require('internal/lib/connectors/services');

const batching = async (request, h, billingRegionForm, refDate) => {
  try {
    const batch = getBatchDetails(request, billingRegionForm, refDate);
    const { data } = await services.water.billingBatches.createBillingBatch(batch);
    const path = routing.getBillingBatchRoute(data.batch, { isBackEnabled: false });
    console.log('I am not ready to be watched!!');
    return h.redirect(path);
  } catch (err) {
    if (err.statusCode === 409) {
      return h.redirect(getBatchCreationErrorRedirectPath(err));
    }
    throw err;
  }
};

const getFinancialYearUrl = (selectedBillingType, selectedTwoPartTariffSeason, selectedBillingRegion) => urlJoin(
  '/billing/batch/financial-year',
  kebabCase(selectedBillingType),
  kebabCase(selectedTwoPartTariffSeason),
  selectedBillingRegion
);

// end sorting hat

const getRegionUrl = (selectedBillingType, selectedTwoPartTariffSeason) => urlJoin(
  '/billing/batch/region',
  kebabCase(selectedBillingType),
  kebabCase(selectedTwoPartTariffSeason)
);
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
    return h.redirect(getRegionUrl(
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

const getBatchDetails = (request, billingRegionForm, refDate = Date.now()) => {
  const {
    selectedBillingType,
    selectedBillingRegion,
    selectedTwoPartTariffSeason
  } = forms.getValues(billingRegionForm);

  const isSummer = selectedTwoPartTariffSeason === seasons.SUMMER;
  const financialYearEnding = getBatchFinancialYearEnding(selectedBillingType, isSummer, refDate);

  const batch = {
    userEmail: request.defra.user.user_name,
    regionId: selectedBillingRegion,
    batchType: selectedBillingType,
    financialYearEnding,
    isSummer: selectedTwoPartTariffSeason === seasons.SUMMER
  };
  return batch;
};

const getBatchCreationErrorRedirectPath = err => {
  const { batch } = err.error;
  if (batch.status === 'sent') {
    return `/billing/batch/${batch.id}/duplicate`;
  }
  return `/billing/batch/${batch.id}/exists`;
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
    const path = getRegionUrl(selectedBillingType, selectedTwoPartTariffSeason);
    return h.postRedirectGet(billingRegionForm, path);
  }

  if (selectedBillingType !== TWO_PART_TARIFF) {
    return batching(request, h, billingRegionForm, refDate);
  }

  const isSummer = selectedTwoPartTariffSeason === seasons.SUMMER;
    const body = {
      userEmail: request.defra.user.user_name,
      regionId: selectedBillingRegion,
      batchType: selectedBillingType,
      isSummer
    }

  const stuff = await water.billingBatches.getBatchBillableYears(body)

  if (stuff.unsentYears.length > 1) {
    const path = getFinancialYearUrl(selectedBillingType, selectedTwoPartTariffSeason, selectedBillingRegion);
    //  TF
    return h.postRedirectGet('', path);
  } else {
    return batching(request, h, billingRegionForm, refDate);
  }
};

const getCreationErrorText = (error, batch) => {
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

const getBillingBatchCreationError = async (request, h, error) => {
  const { batch } = request.pre;
  return h.view('nunjucks/billing/batch-creation-error', {
    ...request.view,
    ...getCreationErrorText(error, batch),
    back: '/billing/batch/region',
    batch: batch
  });
};

const getBillingBatchFinancialYear = async (request, h, error) => {
  const isSummer = request.params.season === seasons.SUMMER;
    const body = {
      userEmail: request.defra.user.user_name,
      regionId: request.params.region,
      batchType: snakeCase(request.params.billingType),
      isSummer
    }
  const stuff = await water.billingBatches.getBatchBillableYears(body)

  const financialYears = stuff.unsentYears.map(year => {
    return {
      from: year - 1,
      to: year
    }
  })

  // const financialYears = [{ from: '2020', to: '2021', isCurrentYear: true }, { from: '2019', to: '2020' }];

  return h.view('nunjucks/form', {
    ...request.view,
    back: '/billing/batch/region',
    form: sessionForms.get(request, selectBillingFinancialYearsForm(request, financialYears))
  });
};

const postBillingBatchFinancialYear = async (request, h, refDate) => {
  const financialYears = getFinancialyears();
  const schema = billingFinancialYearsFormSchema(financialYears);
  const financialYearsForm = forms.handleRequest(selectBillingFinancialYearsForm(request, financialYears), request, schema);

  const { selectedBillingType, selectedTwoPartTariffSeason, selectedBillingRegion } = forms.getValues(financialYearsForm);

  if (!financialYearsForm.isValid) {
    const path = getFinancialYearUrl(selectedBillingType, selectedTwoPartTariffSeason, selectedBillingRegion);
    return h.postRedirectGet(financialYearsForm, path);
  }

  console.log('FIN', request.payload);
};
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
