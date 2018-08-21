/**
 * Controller to allow internal colleagues to submit/edit returns data
 */
// const moment = require('moment');
// const { get } = require('lodash');
const Boom = require('boom');
const { documents } = require('../../../lib/connectors/crm');
const { getReturnData } = require('../lib/helpers');

const { formFactory, handleRequest, fields } = require('./forms');

// const { Form, Radio, Hidden } = require('./forms');

/**
 * Loads return data
 * @param {String} returnId
 * @return {Promise}
 */
const loadReturn = async (returnId) => {
  // Load return data by return ID
  const data = await getReturnData(returnId);

  this.return = data.return;

  // Load CRM document header
  const { data: [documentHeader] } = await documents.findMany({ system_external_id: data.return.licence_ref });

  if (!documentHeader) {
    throw Boom.notFound(`Document header not found for ${data.return.licence_ref}`);
  }

  this.documentHeader = documentHeader;
};

const createViewModel = async (returnId) => {

};

/**
 * @todo functional approach
 */
class ReturnsViewModel {
  constructor () {
    this.formData = {
      isNil: null,
      units: null,
      lines: []
    };

    this.documentHeader = null;
    this.return = null;
  }

  getData () {
    const { formData, documentHeader, return: returnData } = this;
    return {
      formData,
      documentHeader,
      return: returnData
    };
  }

  setData (data) {
    this.data = data;
  }

  /**
   * Loads return data
   * @param {String} returnId
   * @return {Promise}
   */
  async loadReturn (returnId) {
    // Load return data by return ID
    const data = await getReturnData(returnId);

    this.return = data.return;

    // Load CRM document header
    const { data: [documentHeader] } = await documents.findMany({ system_external_id: data.return.licence_ref });

    if (!documentHeader) {
      throw Boom.notFound(`Document header not found for ${data.return.licence_ref}`);
    }

    this.documentHeader = documentHeader;
  }
}

const createForm = (request) => {
  const { returnId } = request.query;
  const { csrfToken } = request.view;
  const action = `/admin/return?returnId=${returnId}`;

  const f = formFactory(action);
  f.fields.push(fields.radio('isNil', {label: 'Are there any abstraction amounts to report?', choices: ['Yes', 'No']}));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  // console.log(JSON.stringify(f, null, 2));

  //
  // const f = new Form({action});
  // f.add(new Radio('isNil', 'Are there any abstraction amounts to report?', ['Yes', 'No']))
  //   .add(new Hidden('csrf_token'));
  //
  // f.set('csrf_token', csrfToken);

  return f;
};

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { returnId } = request.query;

  // console.log(request);

  // const action = `/admin/return?returnId=${returnId}`;

  // Load return data
  const view = new ReturnsViewModel();
  await view.loadReturn(returnId);

  const form = createForm(request);

  // console.log(f.getView());

  return h.view('water/returns/internal/amounts', {
    form,
    ...request.view
  });

  // const data = view.getData();
  //
  // return h.view('water/returns/internal/amounts', {
  //   ...request.view,
  //   ...data,
  //   formAction: `/admin/return?returnId=${returnId}`
  // });
};

/**
 * Post handler for amounts / nil return
 * @param {String} request.query.returnId - the return to edit
 */
const postAmounts = async (request, h) => {
  const form = createForm(request);

  const f2 = handleRequest(form, request);

  // console.log(f2);

  return h.view('water/returns/internal/amounts', {
    form: f2,
    ...request.view
  });
};

module.exports = {
  getAmounts,
  postAmounts
};
