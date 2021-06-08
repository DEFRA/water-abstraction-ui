'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const controller = require('internal/modules/billing/controllers/invoice-licences');
const formHelpers = require('../../../../lib/form-test');

experiment('internal/modules/billing/controllers/invoice-licences', () => {
  let h, request;

  const csrfToken = uuid();
  const batchId = uuid();
  const invoiceId = uuid();
  const invoiceLicenceId = uuid();

  const batch = {
    id: batchId,
    type: 'two_part_tariff'
  };

  const invoice = {
    id: invoiceId,
    invoiceLicences: [
      {
        id: invoiceLicenceId,
        transactions: [],
        licence: {
          licenceNumber: '12/34/56'
        },
        hasTransactionErrors: false
      }
    ]
  };

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    };

    request = {
      path: `/billing/batch/${batchId}/invoice/${invoiceId}/delete-licence/${invoiceLicenceId}`,
      params: {
        batchId,
        invoiceLicenceId
      },
      pre: {
        batch,
        invoice
      },
      view: {
        csrfToken
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getDeleteInvoiceLicence', () => {
    experiment('when the invoice licence exists', () => {
      beforeEach(async () => {
        await controller.getDeleteInvoiceLicence(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/billing/confirm-invoice-licence.njk');
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/billing/confirm-invoice-licence.njk');
      });

      test('sets the correct page title in the view', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal(`You're about to remove this licence from the two-part tariff bill run`);
      });

      test('sets the batch in the view', async () => {
        const [, { batch }] = h.view.lastCall.args;
        expect(batch).to.equal(request.pre.batch);
      });

      test('sets the invoice in the view', async () => {
        const [, { invoice }] = h.view.lastCall.args;
        expect(invoice).to.equal(request.pre.invoice);
      });

      test('sets the invoiceLicence in the view', async () => {
        const [, { invoiceLicence }] = h.view.lastCall.args;
        expect(invoiceLicence).to.equal(request.pre.invoice.invoiceLicences[0]);
      });

      test('sets the confirm form object in the view', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
        expect(form.method).to.equal('POST');
        expect(form.action).to.equal(request.path);
        const button = formHelpers.findButton(form);
        expect(button.options.label).to.equal('Remove this licence');
      });

      test('sets the back button link', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(`/billing/batch/${batchId}/invoice/${invoiceId}`);
      });
    });

    experiment('when the invoice licence does not exist', () => {
      let result;

      beforeEach(async () => {
        request.params.invoiceLicenceId = 'some-other-id';
        result = await controller.getDeleteInvoiceLicence(request, h);
      });

      test('returns a not found error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('.postDeleteInvoiceLicence', () => {
    beforeEach(async () => {
      request = {
        params: {
          batchId,
          invoiceId,
          invoiceLicenceId
        },
        services: {
          water: {
            billingInvoiceLicences: {
              deleteInvoiceLicence: sandbox.stub()
            }
          }
        }
      };

      await controller.postDeleteInvoiceLicence(request, h);
    });

    test('calls the service method', async () => {
      expect(request.services.water.billingInvoiceLicences.deleteInvoiceLicence.calledWith(
        invoiceLicenceId
      )).to.be.true();
    });

    test('redirects to the "processing" page', async () => {
      expect(h.redirect.calledWith(
        `/billing/batch/${batchId}/processing?invoiceId=${invoiceId}`
      )).to.be.true();
    });
  });
});
