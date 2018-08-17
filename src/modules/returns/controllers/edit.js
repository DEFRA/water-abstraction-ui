/**
 * Controller to allow internal colleagues to submit/edit returns data
 */
const moment = require('moment');
const { get } = require('lodash');
const Boom = require('boom');
const { documents } = require('../../../lib/connectors/crm');
const { getReturnData, getLicenceNumbers } = require('../lib/helpers');

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
    const { data: [documentHeader]} = await documents.findMany({system_external_id: data.return.licence_ref });

    if (!documentHeader) {
      throw Boom.notFound(`Document header not found for ${data.return.licence_ref}`);
    }

    this.documentHeader = documentHeader;
  }
}

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { returnId } = request.query;

  // Load return data
  const view = new ReturnsViewModel();
  await view.loadReturn(returnId);

  const data = view.getData();

  return h.view('water/returns/internal/amounts', {
    ...request.view,
    ...data,
    formAction: `/admin/return?returnId=${returnId}`
  });
};

/**
 * Post handler for amounts / nil return
 * @param {String} request.query.returnId - the return to edit
 */
const postAmounts = async (request, h) => {
  if (request.formError) {
    return getAmounts(request, h);
  }
};

module.exports = {
  getAmounts,
  postAmounts
};
