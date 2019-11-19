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

  const { data } = await services.water.billingRegionsLookUp.getBillingRegions();

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
  const { data } = await services.water.billingRegionsLookUp.getBillingRegions();
  const billingRegionForm = forms.handleRequest(selectBillingRegionForm(request, data), request, billingRegionFormSchema);
  const { selectedBillingType, selectedBillingRegion } = forms.getValues(billingRegionForm);

  if (billingRegionForm.isValid) {
    // const { selectedBillingRegion } = forms.getValues(billingRegionForm);

    console.log(selectedBillingRegion);

    const { userId } = request.params;
    const { user_name: userEmail } = await services.idm.users.findOneById(userId);
    console.log(`The users email is: ${userEmail}`);
    const batch = {
      'id': 1,
      'type': 'supplemantary',
      'region': 'Anglian'
    };
    return h.redirect(`/waiting/${batch.id}`);
  }

  const key = uuid();
  request.yar.set(key, billingRegionForm);
  return h.redirect(`/billing/batch/region/${selectedBillingType}?form=` + key);
};

exports.getBillingBatchType = getBillingBatchType;
exports.postBillingBatchType = postBillingBatchType;
exports.getBillingBatchRegion = getBillingBatchRegion;
exports.postBillingBatchRegion = postBillingBatchRegion;
