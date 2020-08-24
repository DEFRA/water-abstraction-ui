const { kebabCase } = require('lodash');
const urlJoin = require('url-join');
const queryString = require('querystring');

const helpers = require('@envage/water-abstraction-helpers');

const forms = require('shared/lib/forms');

const services = require('internal/lib/connectors/services');

const { selectBillingTypeForm, billingTypeFormSchema } = require('../forms/billing-type');
const { selectBillingRegionForm, billingRegionFormSchema } = require('../forms/billing-region');
const { TWO_PART_TARIFF } = require('../lib/bill-run-types');
const seasons = require('../lib/seasons');
const routing = require('../lib/routing');
const sessionForms = require('shared/lib/session-forms');

const getRegionUrl = (selectedBillingType, selectedTwoPartTariffSeason, formKey) => {
  const path = urlJoin(
    '/billing/batch/region',
    kebabCase(selectedBillingType),
    kebabCase(selectedTwoPartTariffSeason)
  );

  return formKey
    ? `${path}?${queryString.stringify({ form: formKey })}`
    : path;
};

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

const getBatchDetails = (request, billingRegionForm) => {
  const {
    selectedBillingType,
    selectedBillingRegion,
    selectedTwoPartTariffSeason
  } = forms.getValues(billingRegionForm);

  const financialYear = helpers.charging.getFinancialYear();
  const financialYearEnding = selectedTwoPartTariffSeason === seasons.WINTER_AND_ALL_YEAR
    ? financialYear - 1
    : financialYear;

  const batch = {
    userEmail: request.defra.user.user_name,
    regionId: selectedBillingRegion,
    batchType: selectedBillingType,
    financialYearEnding,
    isSummer: selectedTwoPartTariffSeason === seasons.SUMMER
  };
  return batch;
};

/**
 * Step 2b received step 2a posted data
 * try to create a new billing run batch
 * redirect to waiting page
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchRegion = async (request, h) => {
  const { regions } = request.pre;
  const schema = billingRegionFormSchema(regions);
  const billingRegionForm = forms.handleRequest(selectBillingRegionForm(request, regions), request, schema);

  if (!billingRegionForm.isValid) {
    const { selectedBillingType, selectedTwoPartTariffSeason } = forms.getValues(billingRegionForm);
    const path = getRegionUrl(selectedBillingType, selectedTwoPartTariffSeason);
    return h.postRedirectGet(billingRegionForm, path);
  }

  try {
    const batch = getBatchDetails(request, billingRegionForm);
    const { data } = await services.water.billingBatches.createBillingBatch(batch);
    const path = routing.getBillingBatchRoute(data.batch, false);
    return h.redirect(path);
  } catch (err) {
    if (err.statusCode === 409) {
      return h.redirect(`/billing/batch/${err.error.existingBatch.id}/exists`);
    }
    throw err;
  }
};

/**
 * If the Bill run for the type and region exists then display a basic summary page
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchExists = async (request, h) => {
  return h.view('nunjucks/billing/batch-exist', {
    ...request.view,
    today: new Date(),
    back: '/billing/batch/region',
    batch: request.pre.batch
  });
};

exports.getBillingBatchType = getBillingBatchType;
exports.postBillingBatchType = postBillingBatchType;

exports.getBillingBatchRegion = getBillingBatchRegion;
exports.postBillingBatchRegion = postBillingBatchRegion;

exports.getBillingBatchExists = getBillingBatchExists;
