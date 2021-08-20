'use strict';

const confirmForm = require('shared/lib/forms/confirm-form');
const mappers = require('../lib/mappers');

const getDeleteInvoiceLicence = async (request, h) => {
  const { batchId } = request.params;
  const { batch, invoice, invoiceLicence } = request.pre;

  const batchType = mappers.mapBatchType(batch.type).toLowerCase();

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

const postDeleteInvoiceLicence = async (request, h) => {
  const { batchId, invoiceId, invoiceLicenceId } = request.params;
  await request.services.water.billingInvoiceLicences.deleteInvoiceLicence(invoiceLicenceId);
  return h.redirect(`/billing/batch/${batchId}/processing?invoiceId=${invoiceId}`);
};

exports.getDeleteInvoiceLicence = getDeleteInvoiceLicence;
exports.postDeleteInvoiceLicence = postDeleteInvoiceLicence;
