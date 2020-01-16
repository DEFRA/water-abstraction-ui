const uuid = require('uuid/v4');
const { selectBillingTypeForm, billingTypeFormSchema } = require('./forms/billing-type');
const { selectBillingRegionForm, billingRegionFormSchema } = require('./forms/billing-region');
const services = require('internal/lib/connectors/services');
const forms = require('shared/lib/forms');
const { get } = require('lodash');
const moment = require('moment');
const queryString = require('querystring');
const helpers = require('@envage/water-abstraction-helpers');
const regions = require('./lib/regions');
const batchService = require('./services/batchService');

const getSessionForm = (request) => {
  return request.yar.get(get(request, 'query.form'));
};

const clearSessionForm = (request) => {
  request.yar.clear(get(request, 'query.form'));
};

/**
 * Step 1a of create billing batch flow - display form to select type
 * i.e. Annual, Supplementary, Two-Part Tariff
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchType = async (request, h) => {
  const sessionForm = getSessionForm(request);
  if (sessionForm) { clearSessionForm(request); }

  return h.view('nunjucks/form', {
    ...request.view,
    back: '/manage',
    form: sessionForm || selectBillingTypeForm(request)
  });
};

const getBillingRegions = async () => {
  const { data } = await services.water.regions.getRegions();
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
  const sessionForm = getSessionForm(request);
  if (sessionForm) { clearSessionForm(request); }

  const regions = await getBillingRegions();

  return h.view('nunjucks/form', {
    ...request.view,
    back: '/billing/batch/type',
    form: sessionForm || selectBillingRegionForm(request, regions)
  });
};

const getBatchDetails = (request, billingRegionForm) => {
  const { selectedBillingType, selectedBillingRegion } = forms.getValues(billingRegionForm);
  const financialYear = (new Date().getMonth > 3) ? helpers.charging.getFinancialYear() + 1 : helpers.charging.getFinancialYear();
  const batch = {
    'userEmail': request.defra.user.user_name,
    'regionId': selectedBillingRegion,
    'batchType': selectedBillingType,
    'financialYearEnding': financialYear,
    'season': 'all year' // ('summer', 'winter', 'all year').required();
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
  const regions = await getBillingRegions();
  const billingRegionForm = forms.handleRequest(selectBillingRegionForm(request, regions), request, billingRegionFormSchema);

  if (!billingRegionForm.isValid) {
    const { selectedBillingType } = forms.getValues(billingRegionForm);
    const key = uuid();
    request.yar.set(key, billingRegionForm);
    return h.redirect(`/billing/batch/region/${selectedBillingType}?` + queryString.stringify({ form: key }));
  }

  try {
    const batch = getBatchDetails(request, billingRegionForm);
    const { data: { event } } = await services.water.billingBatchCreateService.createBillingBatch(batch);
    return h.redirect(`/waiting/${event.event_id}?back=0`);
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
    pageTitle: pageTitle,
    batch: {
      batchId: request.params.batchId,
      billRunTotal: 12345.67,
      invoices: { count: 12, total: 12345.67 + 987.65 },
      creditNotes: { count: 1, total: 987.65 },
      charges: [
        { account: 123, contact: 'Mr A Parson', licences: [ { licenceRef: '111' }, { licenceRef: '111/1' } ], total: 1234.56, isCredit: false },
        { account: 1234, contact: 'Mrs B Darson', licences: [ { licenceRef: '222' }, { licenceRef: '222/1' } ], total: 1333.56, isCredit: true }
      ]
    },

    // only show the back link from the list page, so not to offer the link
    // as part of the batch creation flow.
    back: request.query.back && '/billing/batch/list'
  });
};

const getBillingBatchInvoice = async (request, h) => {
  const invoice =
  {
    id: '3e5add08-3e46-48b7-9325-b48ab1ddb363',
    account: {
      number: '021545',
      companyName: 'Company name Ltd.',
      contactAddress:
        { name: 'Business department', addressLine1: 'Address Line 1', addressLine2: 'Address Line 2', county: 'Countyshire', postCode: 'Post Code' }
    },
    header: { credit: 987.21, debit: 654.21, total: 5465.56, isCredit: false, year: 2020 }, // totals for the licence for the year
    licences: [ // many licences for an invoice
      {
        id: '3e5add08-3e46-48b7-9325-b48ab1ddb363',
        ref: '03/28/60/0032',
        year: '2020',
        transactions: [ // many transactions per licence
          {
            header: { // summary of the transaction lines
              id: 1,
              description: 'Spray irrigation, base licence',
              startDate: '01 April',
              endDate: '31 December',
              code: 'S127 (Two-part tariff)',
              credit: 321.45,
              debit: 921.85,
              isCredit: false,
              totalAmount: 600.40,
              year: 2020
            },
            transactionLines: [ // many transactions
              {
                lineId: 1,
                abstractionPeriod: { startDate: '1 April', endDate: '31 December' },
                chargeType: 'Standard charge',
                loss: 'High Loss',
                season: 'Summer',
                source: 'Supported source',
                billableDays: '61/300',
                netAmount: 921.45,
                isCredit: false
              }
            ]
          }
        ]
      }
    ]
  };

  const batchId = request.params.batchId;
  return h.view('nunjucks/billing/batch-invoice', {
    ...request.view,
    back: `/billing/batch/${batchId}/summary`,
    pageTitle: 'January 2020 invoice',
    invoice
  });
};

const badge = {
  processing: { status: 'warning', text: 'Building' },
  complete: { status: 'success', text: 'Ready' },
  sent: { text: 'Sent' },
  matching_returns: { status: 'warning', text: 'Review' },
  error: { status: 'error', text: 'Error' }
};

const getBatchType = (type) => {
  const batchType = type.replace(/^\w/, c => c.toUpperCase());
  return (batchType === 'Two_part_tarrif') ? 'Two-part tarrif' : batchType;
};

const mapBatchList = async (batchList) => {
  const regionsList = regions.fromRegions(await getBillingRegions());
  const viewData = batchList.map(batch => ({
    status: batch.status,
    badge: badge[batch.metadata.batch.status],
    batchType: getBatchType(batch.metadata.batch.batch_type),
    region: regionsList.getById(batch.metadata.batch.region_id),
    dateCreated: batch.metadata.batch.date_created,
    eventId: batch.event_id,
    invoices: {
      count: batch.metadata.batch.invoices.count,
      total: batch.metadata.batch.invoices.total
    }
  }));
  return viewData;
};

/**
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchList = async (request, h) => {
  const { page } = request.query;
  const { batchList: { data }, pagination } = batchService.getBatchList(page);
  const batchList = await mapBatchList(data);
  return h.view('nunjucks/billing/batch-list', {
    ...request.view,
    batches: batchList,
    pagination
  });
};

const getBillingBatchCancel = async (request, h) => {
  return h.view('nunjucks/billing/batch-cancel', {
    ...request.view,
    batch: request.defra.batch,
    back: `/billing/batch/${request.defra.batch.id}/summary`
  });
};

const postBillingBatchCancel = async (request, h) => {
  // temporary stub implementation
  return h.redirect('/billing/batch/list');
};

const getBillingBatchConfirm = async (request, h) => {
  return h.view('nunjucks/billing/batch-confirm', {
    ...request.view,
    batch: request.defra.batch,
    back: `/billing/batch/${request.defra.batch.id}/summary`
  });
};

const postBillingBatchConfirm = async (request, h) => {
  // temporary stub implementation
  return h.redirect('/billing/batch/list');
};

exports.getBillingBatchList = getBillingBatchList;
exports.getBillingBatchSummary = getBillingBatchSummary;
exports.getBillingBatchExist = getBillingBatchExist;
exports.getBillingBatchInvoice = getBillingBatchInvoice;

exports.getBillingBatchType = getBillingBatchType;
exports.postBillingBatchType = postBillingBatchType;

exports.getBillingBatchRegion = getBillingBatchRegion;
exports.postBillingBatchRegion = postBillingBatchRegion;

exports.getBillingBatchCancel = getBillingBatchCancel;
exports.postBillingBatchCancel = postBillingBatchCancel;

exports.getBillingBatchConfirm = getBillingBatchConfirm;
exports.postBillingBatchConfirm = postBillingBatchConfirm;
