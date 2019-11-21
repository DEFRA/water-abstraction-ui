// const config = require('internal/config');
const uuid = require('uuid/v4');
const { selectBillingTypeForm, billingTypeFormSchema } = require('./forms/billing-type');
const { selectBillingRegionForm, billingRegionFormSchema } = require('./forms/billing-region');
const services = require('internal/lib/connectors/services');
const forms = require('shared/lib/forms');
const { get } = require('lodash');
// const { addQuery } = require('shared/modules/returns/route-helpers');

/**
 * Step 1a of create billing batch flow - display form to select type
 * i.e. Annual, Supplementary, Two-Part Tariff
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchType = async (request, h) => {
  const sessionForm = request.yar.get(get(request, 'query.form'));
  if (sessionForm) {
    request.view.form = sessionForm;
    request.yar.clear(get(request, 'query.form'));
  }
  const view = {
    ...request.view,
    pageTitle: `Which kind of bill run do you want to create?`
  };
  return h.view('nunjucks/form', {
    ...view,
    back: '/manage',
    form: sessionForm || selectBillingTypeForm(request)
  });
};

/**
 * Step 1b - receive posted step 1a data
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchType = async (request, h) => {
  const billingTypeForm = forms.handleRequest(selectBillingTypeForm(request), request, billingTypeFormSchema);

  if (billingTypeForm.isValid) {
    const { selectedBillingType } = forms.getValues(billingTypeForm);
    return h.redirect(`/billing/batch/region/${selectedBillingType}`);
  }

  const key = uuid();
  request.yar.set(key, billingTypeForm);

  return h.redirect('/billing/batch/type' + '?form=' + key);
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

  const view = {
    ...request.view,
    pageTitle: 'Select the region'
  };

  const { data } = await services.water.billingBatchCreateService.getBillingRegions();

  return h.view('nunjucks/form', {
    ...view,
    back: '/billing/batch/type',
    form: sessionForm || selectBillingRegionForm(request, data)
  });
};

/**
 * Step 2b received step 2a posted data
 * try to create a new billing run batch
 * redirect to waiting page
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchRegion = async (request, h) => {
  const { data } = await services.water.billingBatchCreateService.getBillingRegions();
  const billingRegionForm = forms.handleRequest(selectBillingRegionForm(request, data), request, billingRegionFormSchema);
  const { selectedBillingType, selectedBillingRegion } = forms.getValues(billingRegionForm);

  if (billingRegionForm.isValid) {
    const { userId } = request.defra;
    const { user_name: userEmail } = await services.idm.users.findOneById(userId);

    const batch = {
      'userEmail': userEmail,
      'regionId': selectedBillingRegion,
      'batchType': selectedBillingType,
      'financialYear': new Date().getFullYear(),
      'season': 'summer' // ('summer', 'winter', 'all year').required();
    };
    try {
      const { data: { event } } = await services.water.billingBatchCreateService.createBillingBatch(batch);
      return h.redirect(`/waiting/${event.event_id}`);
    } catch (err) {
      console.log(err);
      if (err.statusCode === 409) {
        // TODO: redirect to a summary page displaying details of existing bill run
        return h.redirect('/billing/batch/exist');
      }
      throw err;
    }
  }
  // if the form is invalid redirect back
  const key = uuid();
  request.yar.set(key, billingRegionForm);
  return h.redirect(`/billing/batch/region/${selectedBillingType}?form=` + key);
};

/**
 * If the Bill run for the type and region exists then display the summary page
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchExist = async (request, h) => {
  const view = {
    ...request.view,
    pageTitle: 'A bill run already exist'
  };

  return h.view('nunjucks/billing/batch-exist', {
    ...view,
    back: '/billing/batch/region'
  });
};

const getBillingBatchSummary = async (request, h) => {
  const view = {
    ...request.view,
    pageTitle: 'The bill run has completed'
  };

  return h.view('nunjucks/billing/batch-summary', {
    ...view
  });
};

exports.getBillingBatchSummary = getBillingBatchSummary;
exports.getBillingBatchExist = getBillingBatchExist;
exports.getBillingBatchType = getBillingBatchType;
exports.postBillingBatchType = postBillingBatchType;
exports.getBillingBatchRegion = getBillingBatchRegion;
exports.postBillingBatchRegion = postBillingBatchRegion;
