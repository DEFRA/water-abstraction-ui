'use strict'

const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const { logger } = require('internal/logger')
const forms = require('shared/lib/forms')
const services = require('internal/lib/connectors/services')
const controller = require('internal/modules/billing/controllers/create-bill-run')
const batchService = require('internal/modules/billing/services/batch-service')
const { getBatchFinancialYearEnding } = require('internal/modules/billing/lib/batch-financial-year')

const billingRegions = {
  data: [
    {
      regionId: '07ae7f3a-2677-4102-b352-cc006828948c',
      chargeRegionId: 'A',
      naldRegionId: 1,
      name: 'Anglian',
      displayName: 'Anglian',
      dateCreated: '2019-11-05T12:10:35.164Z',
      dateUpdated: '2019-11-05T12:10:35.164Z'
    },
    {
      regionId: 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
      chargeRegionId: 'B',
      naldRegionId: 2,
      name: 'Midlands',
      displayName: 'Midlands',
      dateCreated: '2019-11-05T12:10:35.164Z',
      dateUpdated: '2019-11-05T12:10:35.164Z'
    }
  ]
}

const createBatchData = () => ({
  id: 'test-batch-id',
  dateCreated: '2000-01-01T00:00:00.000Z',
  type: 'supplementary',
  region: {
    id: 'test-region-1',
    name: 'Anglian',
    code: 'A'
  },
  totals: {
    netTotal: 43434
  },
  billRunId: 1234
})

const invoice = {
  id: '1',
  invoiceLicences: [
    {
      id: 'invoice-licence-id',
      transactions: [],
      licence: {
        licenceNumber: '12/34/56'
      }
    }],
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
  }
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
    regions: billingRegions.data
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

experiment('internal/modules/billing/controllers/create-bill-run', () => {
  let h, request, batchData

  beforeEach(async () => {
    batchData = createBatchData()

    h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns({ header }),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    }

    sandbox.stub(services.water.regions, 'getRegions').resolves(billingRegions)
    sandbox.stub(services.water.billingBatches, 'getBatch').resolves(batchData)
    sandbox.stub(services.water.billingBatches, 'getBatchInvoice').resolves(invoice)
    sandbox.stub(services.water.billingBatches, 'getBatchInvoices').resolves(batchInvoicesResult)

    sandbox.stub(services.water.billingBatches, 'cancelBatch').resolves()
    sandbox.stub(services.water.billingBatches, 'approveBatch').resolves()

    sandbox.stub(batchService, 'getBatchList')
    sandbox.stub(batchService, 'getBatchInvoice').resolves({ id: 'invoice-account-id', accountNumber: 'A12345678A' })
    sandbox.stub(logger, 'info')

    request = createRequest()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getBillingBatchType', () => {
    beforeEach(async () => {
      await controller.getBillingBatchType(request, h)
    })

    test('the expected view template is used for bill run type', async () => {
      const [templateName] = h.view.lastCall.args
      expect(templateName).to.equal('nunjucks/form')
    })

    test('view context is assigned a back link path for type', async () => {
      const [, view] = h.view.lastCall.args
      expect(view.back).to.equal('/manage')
    })
  })

  experiment('.postBillingBatchType', () => {
    experiment('for a two part tariff bill run ', () => {
      beforeEach(async () => {
        sandbox.stub(forms, 'getValues').returns({
          selectedBillingType: 'two_part_tariff',
          twoPartTariffSeason: 'summer'
        })
      })

      experiment('when the form is valid', () => {
        test('the user is redirected to the expected URL including the season', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: true })

          await controller.postBillingBatchType(request, h)

          const [url] = h.redirect.lastCall.args
          expect(url).to.equal('/billing/batch/region/two-part-tariff/summer')
        })
      })

      experiment('when the form is not valid', () => {
        test('the user is redirected to the billing batch type form', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: false })

          await controller.postBillingBatchType(request, h)

          const [form] = h.postRedirectGet.lastCall.args
          expect(form).to.be.an.object()
        })
      })
    })

    experiment('for an annual bill run ', () => {
      beforeEach(async () => {
        sandbox.stub(forms, 'getValues').returns({
          selectedBillingType: 'annual'
        })
      })

      experiment('when the form is valid', () => {
        test('the user is redirected to the expected URL', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: true })

          await controller.postBillingBatchType(request, h)

          const [url] = h.redirect.lastCall.args
          expect(url).to.equal('/billing/batch/region/annual')
        })
      })

      experiment('when the form is not valid', () => {
        test('the user is redirected to the billing batch type form', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: false })

          await controller.postBillingBatchType(request, h)

          const [form] = h.postRedirectGet.lastCall.args
          expect(form).to.be.an.object()
        })
      })
    })
  })

  experiment('.getBillingBatchRegion', () => {
    beforeEach(async () => {
      await controller.getBillingBatchRegion(request, h)
    })

    test('the expected view template is used for bill run type', async () => {
      const [templateName] = h.view.lastCall.args
      expect(templateName).to.equal('nunjucks/form')
    })

    test('view context is assigned a back link path for type', async () => {
      const [, view] = h.view.lastCall.args
      expect(view.back).to.equal('/billing/batch/type')
    })
  })

  experiment('.postBillingBatchRegion', () => {
    const billingRegionForm = {
      action: '/billing/batch/region',
      method: 'POST',
      isSubmitted: true,
      isValid: true,
      fields: [
        {
          name: 'selectedBillingRegion',
          errors: [],
          value: '6ad67f32-e75d-48c1-93d5-25a0e6263e78'
        },
        {
          name: 'selectedBillingType',
          value: ''
        },
        {
          name: 'selectedTwoPartTariffSeason',
          value: ''
        },
        {
          name: 'csrf_token',
          value: '211e17c9-d285-437b-94c5-adc33ed99dc8'
        }
      ]
    }
    beforeEach(async () => {
      sandbox.stub(services.water.billingBatches, 'createBillingBatch')
    })

    experiment('when the form is valid', () => {
      experiment('and the billing type is annual or supplimentary', () => {
        beforeEach(async () => {
          billingRegionForm.fields[1].value = 'supplementary'
          billingRegionForm.fields[2].value = ''
          sandbox.stub(forms, 'handleRequest').returns(billingRegionForm)
        })
        test('it redirects to waiting page', async () => {
          services.water.billingBatches.createBillingBatch.resolves({
            data: {
              batch: {
                id: 'test-batch-id',
                status: 'processing'
              }
            }
          })

          await controller.postBillingBatchRegion(request, h)

          const [url] = h.redirect.lastCall.args
          expect(url).to.equal('/billing/batch/test-batch-id/processing?back=0')
        })

        experiment('if the billing type is already being processed', () => {
          test('the user is redirected to the batch-exists page', async () => {
            const id = uuid()
            services.water.billingBatches.createBillingBatch.rejects({
              statusCode: 409,
              error: {
                batch: {
                  id,
                  status: 'processing'
                }
              }
            })

            await controller.postBillingBatchRegion(request, h)

            const [url] = h.redirect.lastCall.args
            expect(url).to.equal(`/billing/batch/${id}/exists`)
          })
        })
        experiment('if the billing type has already been sent', () => {
          test('the user is redirected to the duplicate batch page', async () => {
            const id = uuid()
            services.water.billingBatches.createBillingBatch.rejects({
              statusCode: 409,
              error: {
                batch: {
                  id,
                  status: 'sent'
                }
              }
            })

            await controller.postBillingBatchRegion(request, h)

            const [url] = h.redirect.lastCall.args
            expect(url).to.equal(`/billing/batch/${id}/duplicate`)
          })
        })
      })
      experiment('and the billing type is 2 part tarrif', () => {
        beforeEach(async () => {
          billingRegionForm.fields[1].value = 'two_part_tariff'
          billingRegionForm.fields[2].value = 'summer'
          sandbox.stub(forms, 'handleRequest').returns(billingRegionForm)
        })

        experiment('and there is a single billable year', () => {
          beforeEach(async () => {
            const batchBillableYears = {
              unsentYears: [
                2020
              ]
            }
            sandbox.stub(services.water.billingBatches, 'getBatchBillableYears').resolves(batchBillableYears)
          })

          test('it redirects to waiting page', async () => {
            services.water.billingBatches.createBillingBatch.resolves({
              data: {
                batch: {
                  id: 'test-batch-id',
                  status: 'processing'
                }
              }
            })

            await controller.postBillingBatchRegion(request, h)

            const [url] = h.redirect.lastCall.args
            expect(url).to.equal('/billing/batch/test-batch-id/processing?back=0')
          })

          test('it is called with the expected batch data', async () => {
            services.water.billingBatches.createBillingBatch.resolves({
              data: {
                batch: {
                  id: 'test-batch-id',
                  status: 'processing'
                }
              }
            })

            await controller.postBillingBatchRegion(request, h)
            const [batch] = services.water.billingBatches.createBillingBatch.lastCall.args
            const expectedBatch = {
              userEmail: 'test-user@example.com',
              regionId: '6ad67f32-e75d-48c1-93d5-25a0e6263e78',
              batchType: 'two_part_tariff',
              financialYearEnding: 2020,
              isSummer: true
            }
            expect(batch).to.equal(expectedBatch)
          })

          experiment('if the billing type is already being processed', () => {
            test('the user is redirected to the batch-exists page', async () => {
              const id = uuid()
              services.water.billingBatches.createBillingBatch.rejects({
                statusCode: 409,
                error: {
                  batch: {
                    id,
                    status: 'processing'
                  }
                }
              })

              await controller.postBillingBatchRegion(request, h)

              const [url] = h.redirect.lastCall.args
              expect(url).to.equal(`/billing/batch/${id}/exists`)
            })
          })

          experiment('if the billing type has already been sent', () => {
            test('the user is redirected to the duplicate batch page', async () => {
              const id = uuid()
              services.water.billingBatches.createBillingBatch.rejects({
                statusCode: 409,
                error: {
                  batch: {
                    id,
                    status: 'sent'
                  }
                }
              })

              await controller.postBillingBatchRegion(request, h)

              const [url] = h.redirect.lastCall.args
              expect(url).to.equal(`/billing/batch/${id}/duplicate`)
            })
          })
        })

        experiment('and there are multiple billable years', () => {
          beforeEach(async () => {
            const batchBillableYears = {
              unsentYears: [
                2022,
                2021,
                2020
              ]
            }
            sandbox.stub(services.water.billingBatches, 'getBatchBillableYears').resolves(batchBillableYears)
          })

          test('it redirects to the Select the financial year page', async () => {
            services.water.billingBatches.createBillingBatch.resolves({
              data: {
                batch: {
                  id: 'test-batch-id',
                  status: 'processing'
                }
              }
            })

            await controller.postBillingBatchRegion(request, h)

            const url = h.postRedirectGet.lastCall.args[1]
            expect(url).to.equal(
              `/billing/batch/financial-year/two-part-tariff/summer/${billingRegionForm.fields[0].value}`
            )
          })
        })

        experiment('and there are no billable years', () => {
          beforeEach(async () => {
            const batchBillableYears = {
              unsentYears: []
            }
            sandbox.stub(services.water.billingBatches, 'getBatchBillableYears').resolves(batchBillableYears)
          })

          test('it is called with the expected batch data', async () => {
            services.water.billingBatches.createBillingBatch.resolves({
              data: {
                batch: {
                  id: 'test-batch-id',
                  status: 'processing'
                }
              }
            })

            await controller.postBillingBatchRegion(request, h)
            const [batch] = services.water.billingBatches.createBillingBatch.lastCall.args
            const expectedBatch = {
              userEmail: 'test-user@example.com',
              regionId: '6ad67f32-e75d-48c1-93d5-25a0e6263e78',
              batchType: 'two_part_tariff',
              financialYearEnding: getBatchFinancialYearEnding('two_part_tariff', true, Date.now()),
              isSummer: true
            }
            expect(batch).to.equal(expectedBatch)
          })

          experiment('if the billing type is already being processed', () => {
            test('the user is redirected to the batch-exists page', async () => {
              const id = uuid()
              services.water.billingBatches.createBillingBatch.rejects({
                statusCode: 409,
                error: {
                  batch: {
                    id,
                    status: 'processing'
                  }
                }
              })

              await controller.postBillingBatchRegion(request, h)

              const [url] = h.redirect.lastCall.args
              expect(url).to.equal(`/billing/batch/${id}/exists`)
            })
          })

          experiment('if the billing type has already been sent', () => {
            test('the user is redirected to the duplicate batch page', async () => {
              const id = uuid()
              services.water.billingBatches.createBillingBatch.rejects({
                statusCode: 409,
                error: {
                  batch: {
                    id,
                    status: 'sent'
                  }
                }
              })

              await controller.postBillingBatchRegion(request, h)

              const [url] = h.redirect.lastCall.args
              expect(url).to.equal(`/billing/batch/${id}/duplicate`)
            })
          })
        })
      })
    })

    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        sandbox.stub(forms, 'handleRequest').returns(billingRegionForm)
      })

      test('billingRegionForm is NOT valid redirects back to form', async () => {
        forms.handleRequest.returns({ isValid: false })

        await controller.postBillingBatchRegion(request, h)

        const [form] = h.postRedirectGet.lastCall.args
        expect(form).to.be.an.object()
      })
    })
  })

  experiment('.getBillingBatchExists', () => {
    beforeEach(async () => {
      request.pre.batch = {
        id: 'test-batch-id',
        endYear: {
          yearEnding: '2019'
        }
      }
      await controller.getBillingBatchExists(request, h)
    })

    test('the expected view template is used for bill run exist', async () => {
      const [templateName] = h.view.lastCall.args
      expect(templateName).to.equal('nunjucks/billing/batch-creation-error')
    })

    test('view context contains the expected page title', async () => {
      const [, context] = h.view.lastCall.args
      expect(context.pageTitle).to.equal('There is already a bill run in progress for this region')
    })

    test('view context contains the expected warning message', async () => {
      const [, context] = h.view.lastCall.args
      expect(context.warningMessage).to.equal('You need to confirm or cancel this bill run before you can create a new one')
    })

    test('view context contains the expected back link', async () => {
      const [, view] = h.view.lastCall.args
      expect(view.back).to.equal('/billing/batch/region')
    })

    test('adds the batch from the pre handler to the view context', async () => {
      const [, context] = h.view.lastCall.args
      expect(context.batch.id).to.equal('test-batch-id')
    })
  })

  experiment('.getBillingBatchDuplicate', () => {
    beforeEach(async () => {
      request.pre.batch = {
        id: 'test-batch-id',
        endYear: {
          yearEnding: '2019'
        }
      }
      await controller.getBillingBatchDuplicate(request, h)
    })

    test('the expected view template is used for bill run exist', async () => {
      const [templateName] = h.view.lastCall.args
      expect(templateName).to.equal('nunjucks/billing/batch-creation-error')
    })

    test('view context contains the expected page title', async () => {
      const [, context] = h.view.lastCall.args
      expect(context.pageTitle).to.equal('This bill run type has already been processed for 2019')
    })

    test('view context contains the expected warning message', async () => {
      const [, context] = h.view.lastCall.args
      expect(context.warningMessage).to.equal('You can only have one of this bill run type for a region in a financial year')
    })

    test('view context contains the expected back link', async () => {
      const [, view] = h.view.lastCall.args
      expect(view.back).to.equal('/billing/batch/region')
    })

    test('adds the batch from the pre handler to the view context', async () => {
      const [, context] = h.view.lastCall.args
      expect(context.batch.id).to.equal('test-batch-id')
    })
  })

  experiment('.getBillingBatchFinancialYear', () => {
    beforeEach(async () => {
      request.params.billingType = 'two-part-tariff'
      request.params.season = 'summer'
      const batchBillableYears = {
        unsentYears: [
          2022,
          2021,
          2020
        ]
      }
      sandbox.stub(services.water.billingBatches, 'getBatchBillableYears').resolves(batchBillableYears)
    })

    experiment('when the form is valid', () => {
      beforeEach(async () => {
        await controller.getBillingBatchFinancialYear(request, h)
      })

      test('the expected view template is used', async () => {
        const [templateName] = h.view.lastCall.args
        expect(templateName).to.equal('nunjucks/billing/batch-two-part-tariff-billable-years.njk')
      })

      test('view context is assigned a back link path for type', async () => {
        const [, view] = h.view.lastCall.args
        expect(view.back).to.equal('/billing/batch/region/two-part-tariff/summer')
      })

      experiment('the view model is defined with', () => {
        let view

        beforeEach(async () => {
          ([, view] = h.view.lastCall.args)
        })

        test('3 radio buttons representing billable years', async () => {
          expect(view.items).to.be.an.array().length(3)
        })

        test('no error details', async () => {
          expect(view.error).to.be.undefined()
          expect(view.errorList).to.be.undefined()
          expect(view.errorMessage).to.be.undefined()
        })
      })
    })

    experiment('when the form is not valid', () => {
      let view

      beforeEach(async () => {
        request.yar.get = sandbox.stub().returns({
          error: true,
          errorList: [],
          errorMessage: {}
        })
        await controller.getBillingBatchFinancialYear(request, h);
        ([, view] = h.view.lastCall.args)
      })

      test('3 radio buttons representing billable years', async () => {
        expect(view.items).to.be.an.array().length(3)
      })

      test('error details are displayed', async () => {
        expect(view.error).not.to.be.undefined()
        expect(view.errorList).not.to.be.undefined()
        expect(view.errorMessage).not.to.be.undefined()
      })
    })
  })

  experiment('.postBillingBatchFinancialYear', () => {
    beforeEach(async () => {
      request.params.region = '07ae7f3a-2677-4102-b352-cc006828948c'
      request.params.billingType = 'two-part-tariff'
      request.params.season = 'summer'
    })

    experiment('when the form is valid', () => {
      beforeEach(async () => {
        request.payload['select-financial-year'] = '2020'
        sandbox.stub(services.water.billingBatches, 'createBillingBatch')
        services.water.billingBatches.createBillingBatch.resolves({
          data: {
            batch: {
              id: 'test-batch-id',
              status: 'processing'
            }
          }
        })
        await controller.postBillingBatchFinancialYear(request, h)
      })

      test('redirects to waiting page', async () => {
        const [url] = h.redirect.lastCall.args
        expect(url).to.equal('/billing/batch/test-batch-id/processing?back=0')
      })
    })

    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        await controller.postBillingBatchFinancialYear(request, h)
      })

      test('redirects back to form', async () => {
        const [url] = h.redirect.lastCall.args
        expect(url).to.equal(`/billing/batch/financial-year/${request.params.billingType}/${request.params.season}/${request.params.region}`)
      })
    })
  })

  experiment('.postSrocBillingBatch', () => {
    test('it redirects to the summary page', async () => {
      await controller.postSrocBillingBatch(request, h)

      const [url] = h.redirect.lastCall.args
      expect(url).to.equal('/billing/batch/test-batch-id/summary')
    })
  })
})
