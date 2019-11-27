const uuid = require('uuid/v4');
const { selectBillingTypeForm, billingTypeFormSchema } = require('./forms/billing-type');
const { selectBillingRegionForm, billingRegionFormSchema } = require('./forms/billing-region');
const { viewBillRunListForm } = require('./forms/bill-run-list');
const services = require('internal/lib/connectors/services');
const forms = require('shared/lib/forms');
const { get } = require('lodash');
const moment = require('moment');
const queryString = require('querystring');
const helpers = require('@envage/water-abstraction-helpers');

/**
 * Step 1a of create billing batch flow - display form to select type
 * i.e. Annual, Supplementary, Two-Part Tariff
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchType = async (request, h) => {
  const sessionForm = request.yar.get(get(request, 'query.form'));
  if (sessionForm) {
    request.yar.clear(get(request, 'query.form'));
  }
  return h.view('nunjucks/form', {
    ...request.view,
    back: '/manage',
    form: sessionForm || selectBillingTypeForm(request)
  });
};

const getBillingRegions = async () => {
  const { data } = await services.water.billingBatchCreateService.getBillingRegions();
  return data;
};

/**
 * Step 1b - receive posted step 1a data
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchType = async (request, h) => {
  const billingTypeForm = forms.handleRequest(selectBillingTypeForm(request), request, billingTypeFormSchema(request));

  if (billingTypeForm.isValid) {
    const { selectedBillingType } = forms.getValues(billingTypeForm);
    return h.redirect(`/billing/batch/region/${selectedBillingType}`);
  }

  const key = uuid();
  request.yar.set(key, billingTypeForm);
  return h.redirect('/billing/batch/type?' + queryString.stringify({ form: key }));
};

/**
 * Step 2a - display selelct region form
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchRegion = async (request, h) => {
  const sessionForm = request.yar.get(get(request, 'query.form'));
  if (sessionForm) {
    request.view.form = sessionForm;
    request.yar.clear(get(request, 'query.form'));
  }

  const regions = await getBillingRegions();

  return h.view('nunjucks/form', {
    ...request.view,
    back: '/billing/batch/type',
    form: sessionForm || selectBillingRegionForm(request, regions)
  });
};

const getBatchDetails = (billingRegionForm, userEmail) => {
  const { selectedBillingType, selectedBillingRegion } = forms.getValues(billingRegionForm);
  const financialYear = (new Date().getMonth > 3) ? helpers.charging.getFinancialYear() + 1 : helpers.charging.getFinancialYear();
  const batch = {
    'userEmail': userEmail,
    'regionId': selectedBillingRegion,
    'batchType': selectedBillingType,
    'financialYearEnding': financialYear,
    'season': 'all year' // ('summer', 'winter', 'all year').required();
  };
  return batch;
};

const getUserEmail = async (request) => {
  const { userId } = request.defra;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);
  return userEmail;
};

/**
 * get the user details and call the water service to create the batch
 * @param {*} request
 * @param {*} billingRegionForm
 */
const createBatch = async (request, billingRegionForm) => {
  const userEmail = await getUserEmail(request);
  const batch = getBatchDetails(billingRegionForm, userEmail);
  const { data: { event } } = await services.water.billingBatchCreateService.createBillingBatch(batch);
  return event.event_id;
};

/**
 * Step 2b received step 2a posted data
 * try to create a new billing run batch
 * redirect to waiting page
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchRegion = async (request, h) => {
  const regions = await getBillingRegions();
  const billingRegionForm = forms.handleRequest(selectBillingRegionForm(request, regions), request, billingRegionFormSchema);

  if (!billingRegionForm.isValid) {
    const { selectedBillingType } = forms.getValues(billingRegionForm);
    const key = uuid();
    request.yar.set(key, billingRegionForm);
    return h.redirect(`/billing/batch/region/${selectedBillingType}?` + queryString.stringify({ form: key }));
  }

  try {
    const event = await createBatch(request, billingRegionForm);
    return h.redirect(`/waiting/${event}`);
  } catch (err) {
    if (err.statusCode === 409) {
      return h.redirect('/billing/batch/exist');
    }
    throw err;
  }
};

/**
 * If the Bill run for the type and region exists then display a basic summary page
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchExist = async (request, h) => {
  return h.view('nunjucks/billing/batch-exist', {
    ...request.view,
    back: '/billing/batch/region'
  });
};

const getBillingBatchSummary = async (request, h) => {
  // get the event date for the bill run date
  const billRunDate = moment();
  const pageTitle = 'Anglian supplementary bill run';

  return h.view('nunjucks/billing/batch-summary', {
    ...request.view,
    billRunDate: billRunDate,
    pageTitle: pageTitle
  });
};

/**
 * @param {*} request
 * @param {*} h
 */
const getBillingBillRunList = async (request, h) => {
  return h.view('nunjucks/billing/bill-run-list', {
    ...request.view,
    back: '/manage',
    form: viewBillRunListForm(request)
  });
};

exports.getBillingBillRunList = getBillingBillRunList;
exports.getBillingBatchSummary = getBillingBatchSummary;
exports.getBillingBatchExist = getBillingBatchExist;
exports.getBillingBatchType = getBillingBatchType;
exports.postBillingBatchType = postBillingBatchType;
exports.getBillingBatchRegion = getBillingBatchRegion;
exports.postBillingBatchRegion = postBillingBatchRegion;
