'use strict';

const confirmForm = require('shared/lib/forms/confirm-form');
const mappers = require('../lib/mappers');

/**
 * Remove an invoice licence from the bill run
 */
const getDeleteInvoiceLicence = async (request, h) => {
  const { batchId, invoiceLicenceId } = request.params;
  const { batch, invoice } = request.pre;

  const batchType = mappers.mapBatchType(batch.type).toLowerCase();

  const invoiceLicence = invoice.invoiceLicences.find(invoiceLicence => invoiceLicence.id === invoiceLicenceId);

  return h.view('nunjucks/billing/confirm-invoice-licence.njk', {
    ...request.view,
    pageTitle: `You're about to remove this licence from the ${batchType} bill run`,
    batch,
    invoice,
    invoiceLicence,
    form: confirmForm.form(request, 'Remove this licence'),
    back: `/billing/batch/${batchId}/invoice/${invoice.id}`
  });
};

exports.getDeleteInvoiceLicence = getDeleteInvoiceLicence;
