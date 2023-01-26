'use strict'

const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sandbox = require('sinon').createSandbox()

const { logger } = require('internal/logger')
const services = require('internal/lib/connectors/services')
const controller = require('internal/modules/billing/controllers/bill-run')
const batchService = require('internal/modules/billing/services/batch-service')
const transactionsCSV = require('internal/modules/billing/services/transactions-csv')
const csv = require('internal/lib/csv-download')

const createBatchData = () => ({
  id: 'test-batch-id',
  dateCreated: '2000-01-01T00:00:00.000Z',
  type: 'supplementary',
  region: {
    id: 'test-region-1',
    name: 'Anglian',
    displayName: 'Anglian',
    code: 'A'
  },
  totals: {
    netTotal: 43434
  },
  billRunNumber: 1234,
  source: 'wrls'
})

const invoice = {
  id: '1',
  invoiceLicences: [
    {
      id: 'invoice-licence-id',
      transactions: [],
      licence: {
        licenceNumber: '12/34/56'
      },
      hasTransactionErrors: false
    }
  ],
  dateCreated: '2020-01-27T13:51:29.234Z',
  totals: {
    netTotal: '1234.56'
  },
  invoiceAccount: {
    id: 'invoice-account-id',
    accountNumber: 'A12345678A',
    company: {
      name: 'COMPANY NAME'
    }
  },
  financialYear: {
    yearEnding: 2020
  },
  originalInvoiceId: null,
  rebillingState: null
}

const invoiceWithLinks = {
  id: '1',
  invoiceLicences: [
    {
      id: 'invoice-licence-id',
      transactions: [],
      licence: {
        licenceNumber: '12/34/56'
      },
      hasTransactionErrors: false
    }
  ],
  dateCreated: '2020-01-27T13:51:29.234Z',
  totals: {
    netTotal: '1234.56'
  },
  invoiceAccount: {
    id: 'invoice-account-id',
    accountNumber: 'A12345678A',
    company: {
      name: 'COMPANY NAME'
    }
  },
  financialYear: {
    yearEnding: 2020
  },
  originalInvoiceId: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
  rebillingState: 'rebill',
  isFlaggedForRebilling: true,
  linkedInvoices: []
}

const batchInvoicesResult = [
  {
    id: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
    accountNumber: 'A12345678A',
    name: 'Test company 1',
    netTotal: 12345,
    licenceNumbers: [
      '01/123/A'
    ],
    isWaterUndertaker: false
  },
  {
    id: '9a806cbb-f1b9-49ae-b551-98affa2d2b9b',
    accountNumber: 'A89765432A',
    name: 'Test company 2',
    netTotal: -675467,
    licenceNumbers: [
      '04/567/B'
    ],
    isWaterUndertaker: true
  }]

const secondHeader = sandbox.stub()
const header = sandbox.stub().returns({ header: secondHeader })

const createRequest = () => ({
  pre: {
    batch: createBatchData(),
    invoice
  },
  params: {
    batchId: 'test-batch-id',
    invoiceId: 'test-invoice-id'
  },
  query: { back: 0 },
  payload: {
    csrf_token: 'bfc56166-e983-4f01-90fe-f70c191017ca'
  },
  view: { foo: 'bar' },
  log: sandbox.spy(),
  defra: {
    user: {
      user_name: 'test-user@example.com'
    }
  },
  yar: {
    get: sandbox.stub().returns({
      // form object or null depending on test
    }),
    set: sandbox.stub(),
    clear: sandbox.stub()
  }
})

experiment('internal/modules/billing/controller', () => {
  let h, request, requestWithRebilling, batchData

  beforeEach(async () => {
    batchData = createBatchData()

    h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns({ header }),
      redirect: sandbox.stub()
    }

    sandbox.stub(services.water.billingBatches, 'getBatch').resolves(batchData)
    sandbox.stub(services.water.billingBatches, 'getBatchInvoice').resolves(invoice)
    sandbox.stub(services.water.billingBatches, 'getBatchInvoices').resolves(batchInvoicesResult)
    sandbox.stub(services.water.billingBatches, 'deleteInvoiceFromBatch').resolves()
    sandbox.stub(services.water.billingBatches, 'getBatchDownloadData')

    sandbox.stub(services.water.billingBatches, 'cancelBatch').resolves()
    sandbox.stub(services.water.billingBatches, 'approveBatch').resolves()
    sandbox.stub(services.water.billingBatches, 'setBatchStatusToError').resolves()

    sandbox.stub(services.water.billingBatches, 'deleteAllBillingData').resolves()

    sandbox.stub(batchService, 'getBatchList')
    sandbox.stub(batchService, 'getBatchInvoice').resolves({ id: 'invoice-account-id', accountNumber: 'A12345678A' })
    sandbox.stub(logger, 'info')

    sandbox.stub(transactionsCSV, 'createCSV')
    sandbox.stub(transactionsCSV, 'getCSVFileName').returns('fileName')
    sandbox.stub(csv, 'csvDownload')

    request = createRequest()
    requestWithRebilling = createRequest()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getBillingBatchSummary', () => {
    experiment('when the batch type is annual', () => {
      beforeEach(async () => {
        request.pre.batch.type = 'annual'
        await controller.getBillingBatchSummary(request, h)
      })

      experiment('the view model is populated with', () => {
        let view

        beforeEach(async () => {
          ([, view] = h.view.lastCall.args)
        })

        test('invoices divided into 2 groups for water undertakers and other abstractors', async () => {
          expect(view.invoices).to.be.an.object()
          expect(view.invoices.waterUndertakers).to.be.an.array().length(1)
          expect(view.invoices.otherAbstractors).to.be.an.array().length(1)
        })

        test('the "water undertakers" group only includes invoices where the flag is set', async () => {
          expect(view.invoices.waterUndertakers[0].isWaterUndertaker).to.be.true()
        })

        test('the "other abstractors" group only includes invoices where the flag is cleared', async () => {
          expect(view.invoices.otherAbstractors[0].isWaterUndertaker).to.be.false()
        })

        test('an "errors" array', async () => {
          expect(view.errors).to.be.an.array().length(0)
        })
      })
    })

    experiment('when the batch type is not annual', () => {
      beforeEach(async () => {
        await controller.getBillingBatchSummary(request, h)
      })

      test('the expected view template is used for bill run summary', async () => {
        const [templateName] = h.view.lastCall.args
        expect(templateName).to.equal('nunjucks/billing/batch-summary')
      })

      experiment('the view model is populated with', () => {
        let view

        beforeEach(async () => {
          ([, view] = h.view.lastCall.args)
        })

        test('the page title including the region name and batch type', async () => {
          expect(view.pageTitle).to.equal('Anglian supplementary bill run')
        })

        test('includes the correct sub-heading', async () => {
          expect(view.subHeading).to.equal('2 supplementary bills')
        })

        test('the batch data', async () => {
          expect(view.batch).to.equal(request.pre.batch)
        })

        test('the first invoice, with isCredit flag true', async () => {
          expect(view.invoices[0]).to.equal({
            id: '9a806cbb-f1b9-49ae-b551-98affa2d2b9b',
            accountNumber: 'A89765432A',
            isWaterUndertaker: true,
            group: 'waterUndertakers',
            name: 'Test company 2',
            netTotal: -675467,
            licenceNumbers: [
              '04/567/B'
            ],
            isCredit: true,
            sortValue: -675467
          })
        })

        test('the second invoice, with isCredit flag false', async () => {
          expect(view.invoices[1]).to.equal({
            id: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
            accountNumber: 'A12345678A',
            isWaterUndertaker: false,
            group: 'otherAbstractors',
            name: 'Test company 1',
            netTotal: 12345,
            licenceNumbers: [
              '01/123/A'
            ],
            isCredit: false,
            sortValue: -12345
          })
        })

        test('an "errors" array', async () => {
          expect(view.errors).to.be.an.array().length(0)
        })
      })

      test('does not include the back link if the "back" query param is zero', async () => {
        await controller.getBillingBatchSummary(request, h)
        const [, view] = h.view.lastCall.args
        expect(view.back).to.equal(0)
      })

      test('includes the back link if "back" query param is 1', async () => {
        await controller.getBillingBatchSummary({ ...request, query: { back: 1 } }, h)
        const [, view] = h.view.lastCall.args
        expect(view.back).to.equal('/billing/batch/list')
      })
    })
  })

  experiment('.getBillingBatchInvoice', () => {
    experiment('for a WRLS supplementary batch', () => {
      beforeEach(async () => {
        await controller.getBillingBatchInvoice(request, h)
      })

      test('calls getBatch in billingBatches service with batchId', async () => {
        const [batchId] = services.water.billingBatches.getBatch.lastCall.args
        expect(batchId).to.equal(request.params.batchId)
      })

      test('calls getBatchInvoice in billingBatches service with batchId and invoiceId', async () => {
        const [batchId, invoiceId] = services.water.billingBatches.getBatchInvoice.lastCall.args
        expect(batchId).to.equal(request.params.batchId)
        expect(invoiceId).to.equal(request.params.invoiceId)
      })

      test('the expected view template is used', async () => {
        const [templateName] = h.view.lastCall.args
        expect(templateName).to.equal('nunjucks/billing/batch-invoice')
      })

      test('the expected data', async () => {
        const [, view] = h.view.lastCall.args
        expect(view).to.contain({ foo: 'bar' })
        expect(view.back).to.equal(`/billing/batch/${request.params.batchId}/summary`)
        expect(view.pageTitle).to.equal('Bill for Company Name')
        expect(view.invoice).to.equal(invoice)
        expect(view.batch).to.equal(batchData)
        expect(view.batchType).to.equal('Supplementary')
        expect(view.invoiceLicences).to.be.an.array()
        expect(view.isCredit).to.be.false()
        expect(view.caption).to.equal('Billing account A12345678A')
        expect(view.financialYearEnding).to.equal(2020)
        expect(view.errors).to.be.an.array().length(0)
      })

      test('credit debit summary block is displayed', async () => {
        const [, view] = h.view.lastCall.args
        expect(view.isCreditDebitBlockVisible).to.be.true()
      })
    })

    experiment('linkedInvoices sent to nunjucks', () => {
      const invoiceNumber = 'A12345'

      beforeEach(async () => {
        invoiceWithLinks.linkedInvoices = []
        invoiceWithLinks.linkedInvoices.push({
          id: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
          accountNumber: 'A12345678A',
          name: 'Test company 1',
          netTotal: 12345,
          licenceNumbers: [
            '01/123/A'
          ],
          isWaterUndertaker: false,
          originalInvoiceId: '9a806cbb-f1b9-49ae-b551-98affa2d2b9b',
          rebillingState: 'rebill',
          displayLabel: 'A12345b',
          originalInvoice: { id: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9a', displayLabel: 'A12345' }
        })

        services.water.billingBatches.getBatchInvoice.resolves({
          ...invoiceWithLinks,
          invoiceNumber
        })
        await controller.getBillingBatchInvoice(request, h)
      })

      test('the expected view template is used for bill run type', async () => {
        const [templateName] = h.view.lastCall.args
        expect(templateName).to.equal('nunjucks/billing/batch-invoice')
      })

      test('linkedInvoices array populated', async () => {
        const [, view] = h.view.lastCall.args
        expect(view.invoice.linkedInvoices.length).to.equal(1)
      })

      test('passes the expected data in the view context', async () => {
        const [, context] = h.view.lastCall.args
        expect(context.invoice.rebillingState).to.contain('rebill')
      })
    })

    experiment('when a bill has an invoiceNumber set', () => {
      const invoiceNumber = 'A12345'

      beforeEach(async () => {
        services.water.billingBatches.getBatchInvoice.resolves({
          ...invoice,
          invoiceNumber
        })
        await controller.getBillingBatchInvoice(request, h)
      })

      test('the caption includes the invoice number', async () => {
        const [, view] = h.view.lastCall.args
        expect(view.caption).to.equal(`Bill ${invoiceNumber}`)
      })
    })

    const batchTypes = [{
      source: 'wrls',
      type: 'annual'
    }, {
      source: 'wrls',
      type: 'two_part_tariff'
    }, {
      source: 'nald',
      type: 'annual'
    }, {
      source: 'nald',
      type: 'supplementary'
    }, {
      source: 'nald',
      type: 'two_part_tariff'
    }]

    batchTypes.forEach(({ source, type }) => {
      experiment(`for a ${source} ${type} batch`, () => {
        beforeEach(async () => {
          services.water.billingBatches.getBatch.resolves({
            ...createBatchData(),
            source,
            type
          })
          await controller.getBillingBatchInvoice(request, h)
        })

        test('credit debit summary block is not displayed', async () => {
          const [, view] = h.view.lastCall.args
          expect(view.isCreditDebitBlockVisible).to.be.false()
        })
      })
    })
  })

  experiment('.getBillingBatchList', () => {
    let batchesResponse

    beforeEach(async () => {
      batchesResponse = {
        data: [
          {
            invoices: [],
            id: '8ae7c31b-3c5a-44b8-baa5-a10b40aef9e1',
            type: 'supplementary',
            season: 'all year',
            status: 'processing',
            dateCreated: '2019-11-29T12:24:06.585Z',
            dataUpdated: '2019-11-29T12:24:06.585Z',
            startYear: {
              yearEnding: 2020
            },
            endYear: {
              yearEnding: 2020
            },
            region: {
              type: 'region',
              id: '07ae7f3a-2677-4102-b352-cc006828948c',
              name: 'Anglian',
              code: 'A',
              numericCode: 1
            },
            creditNoteCount: 2,
            invoiceCount: 12,
            netTotal: 4005,
            externalId: 1234,
            scheme: 'alcs'
          },
          {
            invoices: [],
            id: '8ae7c31b-3c5a-44b8-baa5-a10b40aef9e2',
            type: 'Two-part tariff',
            season: 'all year',
            status: 'review',
            dateCreated: '2019-11-29T12:24:06.585Z',
            dateUpdated: '2019-11-29T12:24:06.585Z',
            startYear: {
              yearEnding: 2020
            },
            endYear: {
              yearEnding: 2020
            },
            region: {
              type: 'region',
              id: 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
              name: 'Midlands',
              code: 'M',
              numericCode: 2
            },
            creditNoteCount: 5,
            invoiceCount: 3,
            netTotal: 4005,
            externalId: 244,
            scheme: 'sroc'
          }
        ],
        pagination: {
          page: 1,
          pageCount: 4,
          perPage: 2,
          totalRows: 8
        }
      }

      batchService.getBatchList.resolves(batchesResponse)
      await controller.getBillingBatchList(request, h)
    })

    test('passes the required batch list data to the view', async () => {
      const [, context] = h.view.lastCall.args
      const { batches } = context

      expect(batches).to.be.array()
      expect(batches[0].batchType).to.equal('Supplementary')
      expect(batches[0].region.name).to.equal('Anglian')
      expect(batches[0].status).to.equal('processing')
      expect(batches[0].billCount).to.equal(14)
      expect(batches[0].link).to.equal('/billing/batch/8ae7c31b-3c5a-44b8-baa5-a10b40aef9e1/processing?back=1')
      expect(batches[0].scheme).to.equal('alcs')
      expect(batches[1].type).to.equal('Two-part tariff')
      expect(batches[1].region.name).to.equal('Midlands')
      expect(batches[1].status).to.equal('review')
      expect(batches[1].billCount).to.equal(8)
      expect(batches[1].link).to.be.equal('/billing/batch/8ae7c31b-3c5a-44b8-baa5-a10b40aef9e2/two-part-tariff-review')
      expect(batches[1].scheme).to.equal('sroc')
    })

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args
      expect(view).to.equal('nunjucks/billing/batch-list')
    })
  })

  experiment('.getBillingBatchCancel', () => {
    beforeEach(async () => {
      await controller.getBillingBatchCancel(request, h)
    })

    test('passes the expected view template', async () => {
      const [view] = h.view.lastCall.args
      expect(view).to.equal('nunjucks/billing/confirm-batch')
    })

    test('passes the expected data in the view context', async () => {
      const [, context] = h.view.lastCall.args
      expect(context).to.contain({ foo: 'bar' })
      expect(context.batch).to.equal(batchData)
      expect(context.pageTitle).to.equal('You\'re about to cancel this bill run')
      expect(context.secondTitle).to.equal('Anglian supplementary bill run')
      expect(context.form).to.be.an.object()
      expect(context.form.action).to.equal(`/billing/batch/${request.params.batchId}/cancel`)
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary')
    })
  })

  experiment('.postBillingBatchCancel', () => {
    test('the batch id is used to cancel the batch via the water service', async () => {
      await controller.postBillingBatchCancel(request, h)
      const [batchId] = services.water.billingBatches.cancelBatch.lastCall.args
      expect(batchId).to.equal('test-batch-id')
    })

    test('the user is redirected back to the list of batches', async () => {
      await controller.postBillingBatchCancel(request, h)
      const [redirectPath] = h.redirect.lastCall.args
      expect(redirectPath).to.equal('/billing/batch/list')
    })

    test('if the cancellation failed, the user is still redirected back to the list of batches', async () => {
      services.water.billingBatches.cancelBatch.rejects()
      await controller.postBillingBatchCancel(request, h)

      const [redirectPath] = h.redirect.lastCall.args
      expect(redirectPath).to.equal('/billing/batch/list')
    })
  })

  experiment('.getBillingBatchConfirm', () => {
    beforeEach(async () => {
      await controller.getBillingBatchConfirm(request, h)
    })

    test('passes the expected view template', async () => {
      const [view] = h.view.lastCall.args
      expect(view).to.equal('nunjucks/billing/confirm-batch')
    })

    test('passes the expected data in the view context', async () => {
      const [, context] = h.view.lastCall.args
      expect(context).to.contain({ foo: 'bar' })
      expect(context.batch).to.equal(batchData)
      expect(context.pageTitle).to.equal('You\'re about to send this bill run')
      expect(context.secondTitle).to.equal('Anglian supplementary bill run')
      expect(context.form).to.be.an.object()
      expect(context.form.action).to.equal(`/billing/batch/${request.params.batchId}/confirm`)
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary')
    })
  })

  experiment('.postBillingBatchConfirm', () => {
    beforeEach(async () => {
      await controller.postBillingBatchConfirm(request, h)
    })

    test('the batch id is used to approve the batch via the water service', async () => {
      const [batchId] = services.water.billingBatches.approveBatch.lastCall.args
      expect(batchId).to.equal('test-batch-id')
    })

    test('the user is redirected back to the batch summary', async () => {
      const [redirectPath] = h.redirect.lastCall.args
      expect(redirectPath).to.equal('/billing/batch/test-batch-id/processing')
    })

    test('if the approval fails, the user is redirected to the batch summary, an error is thrown', async () => {
      services.water.billingBatches.approveBatch.rejects()
      const func = () => controller.postBillingBatchConfirm(request, h)
      expect(func()).to.reject()
    })
  })

  experiment('.getBillingBatchConfirmSuccess', () => {
    beforeEach(async () => {
      await controller.getBillingBatchConfirmSuccess(request, h)
    })

    test('passes the expected view template', async () => {
      const [view] = h.view.lastCall.args
      expect(view).to.equal('nunjucks/billing/batch-sent-success')
    })

    test('passes the expected data in the view context', async () => {
      const [, context] = h.view.lastCall.args
      expect(context).to.contain({ foo: 'bar' })
      expect(context.pageTitle).to.equal('Bill run sent')
      expect(context.batch).to.equal(batchData)
      expect(context.panelText).to.equal('You\'ve sent the Anglian supplementary bill run 1234')
    })
  })

  experiment('getTransactionsCSV', () => {
    let invoices, chargeVersions, csvData

    beforeEach(async () => {
      invoices = [{ id: 'test-d', invoiceLicences: [], error: null }]
      chargeVersions = [{ id: 'charge-version-id' }]
      services.water.billingBatches.getBatchDownloadData.resolves({ invoices, chargeVersions })

      csvData = [['header1', 'header2', 'header2'], ['transaction', 'line', 1]]
      transactionsCSV.createCSV.returns(csvData)

      await controller.getTransactionsCSV(request, h)
    })

    test('calls billingBatches service with batchId', () => {
      expect(services.water.billingBatches.getBatchDownloadData.calledWith(
        request.params.batchId
      )).to.be.true()
    })

    test('calls transactionsCSV.createCSV with data returned from billingBatches services', () => {
      expect(transactionsCSV.createCSV.calledWith(
        invoices,
        chargeVersions
      )).to.be.true()
    })

    test('calls transactionsCSV.getCSVFileName with data returned from batchService', () => {
      expect(transactionsCSV.getCSVFileName.calledWith(
        batchData
      )).to.be.true()
    })

    test('calls csv.csvDownload with csv data and file name', () => {
      const [, data, fileName] = csv.csvDownload.lastCall.args
      expect(data).to.equal(csvData)
      expect(fileName).to.equal('fileName')
    })
  })

  experiment('.getBillingBatchDeleteInvoice', () => {
    beforeEach(async () => {
      await controller.getBillingBatchDeleteInvoice(request, h)
    })

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args
      expect(view).to.equal('nunjucks/billing/confirm-invoice')
    })

    test('sets the correct view data', async () => {
      const [, context] = h.view.lastCall.args
      expect(context).to.contain({ foo: 'bar' })
      expect(context.pageTitle).to.equal('You\'re about to remove this bill from the supplementary bill run')
      expect(context.batch).to.equal(request.pre.batch)
      expect(context.invoice).to.equal(request.pre.invoice)
      expect(context.form).to.be.an.object()
      expect(context.batch).to.equal(batchData)
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary')
    })
  })

  experiment('.getBillingBatchDeleteInvoice with rebillingState', () => {
    const invoiceNumber = 'A12345'

    beforeEach(async () => {
      invoiceWithLinks.linkedInvoices = []
      invoiceWithLinks.linkedInvoices.push({
        id: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
        accountNumber: 'A12345678A',
        name: 'Test company 1',
        netTotal: 12345,
        licenceNumbers: [
          '01/123/A'
        ],
        isWaterUndertaker: false,
        originalInvoiceId: '9a806cbb-f1b9-49ae-b551-98affa2d2b9b',
        rebillingState: 'rebill',
        displayLabel: 'A12345b',
        originalInvoice: { id: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9a', displayLabel: 'A12345' }
      })

      services.water.billingBatches.getBatchInvoice.resolves({
        ...invoiceWithLinks,
        invoiceNumber
      })
      requestWithRebilling.pre.invoice = invoiceWithLinks
      await controller.getBillingBatchDeleteInvoice(requestWithRebilling, h)
    })

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args
      expect(view).to.equal('nunjucks/billing/confirm-invoice')
    })

    test('sets the correct view data', async () => {
      const [, context] = h.view.lastCall.args
      expect(context.pageTitle).to.equal('You\'re about to cancel the reissue of A12345b')
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary')
    })
  })

  experiment('.postBillingBatchDeleteInvoice', () => {
    beforeEach(async () => {
      await controller.postBillingBatchDeleteInvoice(request, h)
    })

    test('calls the delete method in the water service', async () => {
      expect(services.water.billingBatches.deleteInvoiceFromBatch.calledWith(
        request.params.batchId, request.params.invoiceId
      )).to.be.true()
    })

    test('redirects to the expected url', async () => {
      const [url] = h.redirect.lastCall.args
      expect(url).to.equal('/billing/batch/test-batch-id/summary')
    })
  })

  experiment('.getBillingBatchProcessing', () => {
    let request

    const createRequest = (status, back = 1) => ({
      query: {
        back
      },
      pre: {
        batch: {
          id: 'test-batch-id',
          type: 'two_part_tariff',
          status,
          createdAt: '2020-02-01',
          region: {
            displayName: 'Anglian'
          }
        }
      }
    })

    beforeEach(async () => {
      request = createRequest('processing')
      await controller.getBillingBatchProcessing(request, h)
    })

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/billing/batch-processing')
    })

    test('outputs the page title to the view', async () => {
      const [, { pageTitle }] = h.view.lastCall.args
      expect(pageTitle).to.equal('Anglian two-part tariff bill run')
    })

    test('outputs the batch from request.pre to the view', async () => {
      const [, { batch }] = h.view.lastCall.args
      expect(batch).to.equal(request.pre.batch)
    })

    test('outputs the formatted batch creation date as the caption', async () => {
      const [, { caption }] = h.view.lastCall.args
      expect(caption).to.equal('1 February 2020')
    })

    experiment('when the back query param is 1', () => {
      test('back link is to the batch list page', async () => {
        const [, { back }] = h.view.lastCall.args
        expect(back).to.equal('/billing/batch/list')
      })
    })

    experiment('when the back query param is 0', () => {
      beforeEach(async () => {
        const request = createRequest('processing', 0)
        await controller.getBillingBatchProcessing(request, h)
      })

      test('back link is false', async () => {
        const [, { back }] = h.view.lastCall.args
        expect(back).to.be.false()
      })
    })
  })

  experiment('.getBillingBatchEmpty', () => {
    let request

    const createRequest = () => ({
      pre: {
        batch: {
          id: 'test-batch-id',
          type: 'two_part_tariff',
          status: 'empty',
          createdAt: '2020-02-01',
          region: {
            displayName: 'Anglian'
          }
        }
      }
    })

    beforeEach(async () => {
      request = createRequest()
      await controller.getBillingBatchEmpty(request, h)
    })

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/billing/batch-empty')
    })

    test('outputs the page title to the view', async () => {
      const [, { pageTitle }] = h.view.lastCall.args
      expect(pageTitle).to.equal('Anglian two-part tariff bill run')
    })

    test('outputs the batch from request.pre to the view', async () => {
      const [, { batch }] = h.view.lastCall.args
      expect(batch).to.equal(request.pre.batch)
    })

    test('back link is to the batch list page', async () => {
      const [, { back }] = h.view.lastCall.args
      expect(back).to.equal('/billing/batch/list')
    })
  })

  experiment('.postDeleteAllBillingData', () => {
    beforeEach(async () => {
      await controller.postDeleteAllBillingData(request, h)
    })

    test('calls water service method to delete all data', async () => {
      expect(services.water.billingBatches.deleteAllBillingData.callCount).to.equal(1)
    })

    test('redirects to the billing page', async () => {
      expect(h.redirect.calledWith('/billing/batch/list')).to.be.true()
    })
  })

  experiment('.postBillingBatchStatusToCancel', () => {
    beforeEach(async () => {
      await controller.postBillingBatchStatusToCancel(request, h)
    })

    test('the batch id is used to set error for batch via the water service', async () => {
      const [batchId] = services.water.billingBatches.setBatchStatusToError.lastCall.args
      expect(batchId).to.equal('test-batch-id')
    })

    test('the user is redirected back to the batch summary', async () => {
      const [redirectPath] = h.redirect.lastCall.args
      expect(redirectPath).to.equal('/billing/batch/list')
    })

    test('if fails to set batch status to error, the user is redirected to the batch summary, an error is thrown', async () => {
      services.water.billingBatches.setBatchStatusToError.rejects()
      await controller.postBillingBatchStatusToCancel(request, h)

      const [redirectPath] = h.redirect.lastCall.args
      expect(redirectPath).to.equal('/billing/batch/list')
    })
  })

  experiment('.getBillingBatchStatusToCancel', () => {
    beforeEach(async () => {
      await controller.getBillingBatchStatusToCancel(request, h)
    })

    test('passes the expected view template', async () => {
      const [view] = h.view.lastCall.args
      expect(view).to.equal('nunjucks/billing/confirm-batch')
    })

    test('passes the expected data in the view context', async () => {
      const [, context] = h.view.lastCall.args
      expect(context).to.contain({ foo: 'bar' })
      expect(context.batch).to.equal(batchData)
      expect(context.pageTitle).to.equal('You\'re about to cancel this bill run')
      expect(context.secondTitle).to.equal('Anglian supplementary bill run')
      expect(context.form).to.be.an.object()
      expect(context.form.action).to.equal(`/billing/batch/${request.params.batchId}/cancel/processing-batch`)
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary')
    })
  })
})
