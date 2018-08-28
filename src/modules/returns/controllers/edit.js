/**
 * Controller to allow internal colleagues to submit/edit returns data
 */
// const { get } = require('lodash');
// const Boom = require('boom');
// const { documents } = require('../../../lib/connectors/crm');
// const { getReturnData } = require('../lib/helpers');

const { formFactory, handleRequest, fields, setValues } = require('./forms');

const { returns } = require('../../../lib/connectors/water');

/**
 * Loads return data
 * @param {String} returnId
 * @return {Promise}
 */
// const loadReturn = async (returnId) => {
//   // Load return data by return ID
//   const data = await getReturnData(returnId);
//
//   // Load CRM document header
//   const { data: [documentHeader] } = await documents.findMany({ system_external_id: data.return.licence_ref });
//
//   if (!documentHeader) {
//     throw Boom.notFound(`Document header not found for ${data.return.licence_ref}`);
//   }
//
//   return {
//     documentHeader,
//     return: data.return
//   };
// };

// const createViewModel = async (returnId) => {
//   const { return: returnData, documentHeader } = await loadReturn(returnId);
//   const formData = {
//     isNil: null,
//     units: null,
//     lines: []
//   };
//   return {
//     return: returnData,
//     documentHeader,
//     formData
//   };
// };

const createForm = (request) => {
  const { returnId } = request.query;
  const { csrfToken } = request.view;
  const action = `/admin/return?returnId=${returnId}`;

  const f = formFactory(action);
  f.fields.push(fields.radio('isNil', {
    label: 'Are there any abstraction amounts to report?',
    choices: [
      { value: true, label: 'Yes'},
      { value: false, label: 'No'}
    ]}));

  f.fields.push(fields.date('testDate', {
    label: 'Enter a date',
    hint: 'E.g. your birthday'
  }, new Date()));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  console.log(JSON.stringify(f, null, 2));

  return f;
};

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  request.sessionStore.set('internalReturnFlow', data);

  const form = setValues(createForm(request), data);

  return h.view('water/returns/internal/amounts', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Post handler for amounts / nil return
 * @param {String} request.query.returnId - the return to edit
 */
const postAmounts = async (request, h) => {
  // const { returnId } = request.query;

  const data = request.sessionStore.get('internalReturnFlow');

  const form = handleRequest(setValues(createForm(request), data), request);

  // const form = setValues(createF)

  console.log(data);

  //
  // const view = await createViewModel(returnId);
  // const form = handleRequest(createForm(request), request);

  if (form.isValid) {
    // Persist

  }

  return h.view('water/returns/internal/amounts', {
    form,
    // ...view,
    ...request.view
  });
};

module.exports = {
  getAmounts,
  postAmounts
};
