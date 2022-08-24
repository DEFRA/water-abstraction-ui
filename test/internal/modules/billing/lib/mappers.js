'use strict'
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')
const { pick } = require('lodash')

const mappers = require('internal/modules/billing/lib/mappers')

const batchId = uuid()

const batch = {
  invoices: [],
  id: batchId,
  type: 'two_part_tariff',
  season: 'all year',
  status: 'ready',
  dateCreated: '2020-02-25T16:44:22.827Z',
  dateUpdated: '2020-02-25T16:45:01.328Z',
  startYear: {
    yearEnding: 2020
  },
  endYear: {
    yearEnding: 2020
  },
  region: {
    type: 'region',
    id: '35f681b5-2781-4726-b8d1-cd75b96e7747',
    name: 'Anglian',
    code: 'A',
    numericCode: 1
  },
  creditNoteCount: 2,
  invoiceCount: 4,
  netTotal: '2003'
}

const licenceNumbers = [
  '01/123/456/A',
  '02/345/678/B'
]
const licenceIds = [
  uuid(),
  uuid()
]
const invoiceId = uuid()
const invoiceLicenceIds = [
  uuid(),
  uuid()
]

const invoice = {
  id: invoiceId,
  invoiceLicences: [
    {
      id: invoiceLicenceIds[0],
      licence: {
        id: licenceIds[0],
        licenceNumber: licenceNumbers[0]
      },
      transactions: [{
        value: 924,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_1',
          adjustments: {
            aggregate: 0.25,
            charge: 0.35,
            s126: 0.45,
            s127: true,
            s130: true,
            winter: true
          }
        },
        volume: 12.35,
        billingVolume: {
          calculatedVolume: 12.35,
          volume: 12.35
        },
        isMinimumCharge: false,
        agreements: [{ code: 'S127' }]
      }, {
        value: 1576,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        isMinimumCharge: true,
        agreements: []
      }],
      hasTransactionErrors: true
    },
    {
      id: invoiceLicenceIds[1],
      licence: {
        id: licenceIds[1],
        licenceNumber: licenceNumbers[1]
      },
      transactions: [{
        value: 1234,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_a'
        },
        volume: 12.35,
        billingVolume: {
          calculatedVolume: null,
          volume: 12.35
        },
        isMinimumCharge: false,
        agreements: []
      }, {
        value: 3456,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_b'
        },
        volume: 12.35,
        billingVolume: {
          calculatedVolume: 14.2,
          volume: 12.35
        },
        isMinimumCharge: false,
        agreements: []
      }, {
        value: -363,
        isCredit: true,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_b'
        },
        volume: 12.35,
        billingVolume: {
          calculatedVolume: 12.35,
          volume: 12.35
        },
        isMinimumCharge: false,
        agreements: []
      }, {
        value: 789,
        chargePeriod: {
          startDate: '2020-04-01',
          endDate: '2021-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_b'
        },
        volume: 12.35,
        billingVolume: {
          calculatedVolume: 12.35,
          volume: 12.35
        },
        isMinimumCharge: false,
        agreements: []
      }, {
        value: 916,
        chargePeriod: {
          startDate: '2020-04-01',
          endDate: '2021-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_b'
        },
        volume: 12.35,
        isMinimumCharge: false,
        agreements: []
      }],
      hasTransactionErrors: false
    }],
  rebillingState: null
}

const documentIdMap = new Map()
documentIdMap.set(licenceNumbers[0], '7d6a672f-1d3a-414a-81f7-69e66ff1381c')
documentIdMap.set(licenceNumbers[1], '80b8e0a7-2057-45a4-aad5-fefae0faa43d')

const batchInvoices = [{
  id: 'test-invoice-id-1',
  accountNumber: 'A00000000A',
  financialYearEnding: 2020,
  hasTransactionErrors: false
},
{
  id: 'test-invoice-id-2',
  accountNumber: 'B00000000B',
  financialYearEnding: 2019,
  hasTransactionErrors: true
}]

experiment('modules/billing/lib/mappers', () => {
  let result

  experiment('.mapBatchListRow', () => {
    experiment('when batch.externalId is truthy', () => {
      beforeEach(async () => {
        result = mappers.mapBatchListRow({
          ...batch,
          externalId: 1234
        })
      })

      test('human-readable batch type is set', async () => {
        expect(result.batchType).to.equal('Two-part tariff')
      })

      test('bill count sums the creditNoteCount and invoiceCount', async () => {
        expect(result.billCount).to.equal(6)
      })
    })

    experiment('when batch.totals are set', () => {
      beforeEach(async () => {
        result = mappers.mapBatchListRow(batch)
      })

      test('bill count is the sum of the invoices and credit note counts', async () => {
        expect(result.billCount).to.equal(6)
      })
    })

    experiment('when batch totals are null', () => {
      beforeEach(async () => {
        const pendingBatch = {
          ...batch,
          netTotal: null,
          invoiceCount: null,
          creditNoteCount: null
        }
        result = mappers.mapBatchListRow(pendingBatch)
      })

      test('bill count is null', async () => {
        expect(result.billCount).to.equal(null)
      })
    })
  })

  experiment('.mapBatchType', () => {
    test('supplementary is mapped to sentence case', async () => {
      const result = mappers.mapBatchType('supplementary')
      expect(result).to.equal('Supplementary')
    })

    test('annual is mapped to sentence case', async () => {
      const result = mappers.mapBatchType('annual')
      expect(result).to.equal('Annual')
    })

    test('two_part_tariff is mapped to sentence case and hyphenated', async () => {
      const result = mappers.mapBatchType('two_part_tariff')
      expect(result).to.equal('Two-part tariff')
    })
  })

  experiment('.mapInvoiceLicence', () => {
    experiment('for the first invoice licence', () => {
      const [invoiceLicence] = invoice.invoiceLicences

      beforeEach(async () => {
        result = mappers.mapInvoiceLicence(batch, invoice, invoiceLicence)
      })

      test('includes the id', async () => {
        expect(result.id).to.equal(invoiceLicence.id)
      })

      test('includes the licence number', async () => {
        expect(result.licenceNumber).to.equal(invoiceLicence.licence.licenceNumber)
      })

      test('has transaction errors', async () => {
        expect(result.hasTransactionErrors).to.be.true()
      })

      test('includes a link to the licence page', async () => {
        expect(result.links.view).to.equal(`/licences/${invoiceLicence.licence.id}`)
      })

      test('includes a link to delete the invoice licence', async () => {
        expect(result.links.delete).to.equal(
          `/billing/batch/${batchId}/invoice/${invoiceId}/delete-licence/${invoiceLicenceIds[0]}`
        )
      })

      test('includes the transactions', async () => {
        expect(result.transactions).to.be.an.array().length(2)
      })

      test('the first transaction is mapped correctly', async () => {
        const [transaction] = result.transactions
        const keys = ['value', 'chargePeriod', 'chargeElement', 'volume', 'billingVolume', 'isMinimumCharge']
        expect(pick(transaction, keys)).to.equal(pick(invoiceLicence.transactions[0], keys))
      })

      test('the first transaction agreements are mapped correctly', async () => {
        const [{ agreements }] = result.transactions
        expect(agreements).to.equal([
          {
            code: 'S127',
            description: 'Two-part tariff'
          }
        ])
      })

      test('the second transaction is mapped correctly', async () => {
        const [, transaction] = result.transactions
        const keys = ['value', 'chargePeriod', 'chargeElement', 'volume', 'billingVolume', 'isMinimumCharge']
        expect(pick(transaction, keys)).to.equal(pick(invoiceLicence.transactions[1], keys))
      })

      test('the second transaction agreements are an empty array', async () => {
        const [, { agreements }] = result.transactions
        expect(agreements).to.equal([])
      })
    })

    experiment('when the invoice is a rebilling invoice', () => {
      const [invoiceLicence] = invoice.invoiceLicences

      beforeEach(async () => {
        result = mappers.mapInvoiceLicence(batch, {
          ...invoice,
          rebillingState: 'rebill'
        }, invoiceLicence)
      })

      test('the link to delete the invoice licence is null', async () => {
        expect(result.links.delete).to.be.null()
      })
    })

    experiment('when the batch is not ready', () => {
      const [invoiceLicence] = invoice.invoiceLicences

      beforeEach(async () => {
        result = mappers.mapInvoiceLicence({
          ...batch,
          status: 'sent'
        }, invoice, invoiceLicence)
      })

      test('the link to delete the invoice licence is null', async () => {
        expect(result.links.delete).to.be.null()
      })
    })

    experiment('when the invoice has only 1 licence', () => {
      const [invoiceLicence] = invoice.invoiceLicences

      beforeEach(async () => {
        const invoiceWithSingleLicence = {
          ...invoice,
          invoiceLicences: [
            invoice.invoiceLicences[0]
          ]
        }
        result = mappers.mapInvoiceLicence(batch, invoiceWithSingleLicence, invoiceLicence)
      })

      test('the link to delete the invoice licence is null', async () => {
        expect(result.links.delete).to.be.null()
      })
    })

    experiment('when adjustments are present', () => {
      const invoiceLicence = invoice.invoiceLicences[0]

      beforeEach(async () => {
        result = mappers.mapInvoiceLicence(batch, invoice, invoiceLicence)
      })

      test('the adjustments are displayed', async () => {
        expect(result.transactions[0].adjustments).to.equal(
          'Aggregate factor (0.25), Adjustment factor (0.35), Abatement factor (0.45), Two-part tariff (0.5), Canal and River Trust (0.5), Winter discount (0.5)'
        )
      })
    })

    experiment('when adjustments are not present', () => {
      const invoiceLicence = invoice.invoiceLicences[1]

      beforeEach(async () => {
        result = mappers.mapInvoiceLicence(batch, invoice, invoiceLicence)
      })

      test('the adjustments are not displayed', async () => {
        expect(result.transactions[0].adjustments).to.equal('')
      })
    })
  })

  experiment('.mapInvoices', () => {
    beforeEach(async () => {
      result = mappers.mapInvoices(batch, [invoice])
    })

    test('results contain the invoice', () => {
      expect(result[0]).to.include(invoice)
    })

    experiment('group', () => {
      test('is set to "otherAbstractors" when isWaterUndertaker is false', () => {
        invoice.isWaterUndertaker = false
        result = mappers.mapInvoices(batch, [invoice])
        expect(result[0].group).to.equal('otherAbstractors')
      })

      test('is set to "waterUndertakers" when isWaterUndertaker is true', () => {
        invoice.isWaterUndertaker = true
        result = mappers.mapInvoices(batch, [invoice])
        expect(result[0].group).to.equal('waterUndertakers')
      })
    })

    experiment('isCredit', () => {
      test('is set to false when invoice netTotal is positive', () => {
        invoice.netTotal = 123
        result = mappers.mapInvoices(batch, [invoice])
        expect(result[0].isCredit).to.be.false()
      })

      test('is set to true when invoice netTotal is negative', () => {
        invoice.netTotal = -123
        result = mappers.mapInvoices(batch, [invoice])
        expect(result[0].isCredit).to.be.true()
      })
    })

    experiment('sortValue is set correctly ', () => {
      test('for a positive netTotal', () => {
        invoice.netTotal = 123
        result = mappers.mapInvoices(batch, [invoice])
        expect(result[0].sortValue).to.equal(-123)
      })

      test('for a negative netTotal', () => {
        invoice.netTotal = -123
        result = mappers.mapInvoices(batch, [invoice])
        expect(result[0].sortValue).to.equal(-123)
      })
    })
  })

  experiment('.mapInvoiceLevelErrors', () => {
    beforeEach(async () => {
      result = mappers.mapInvoiceLevelErrors(invoice)
    })

    test('maps to an array of error objects for invoice licences with errors', async () => {
      expect(result).to.equal([{
        id: invoiceLicenceIds[0],
        message: 'There are problems with transactions on licence 01/123/456/A'
      }])
    })
  })

  experiment('.mapBatchLevelErrors', () => {
    beforeEach(async () => {
      result = mappers.mapBatchLevelErrors(batch, batchInvoices)
    })

    test('maps to an array of error objects for invoice licences with errors', async () => {
      expect(result).to.equal([{
        link: `/billing/batch/${batch.id}/invoice/test-invoice-id-2`,
        accountNumber: 'B00000000B',
        financialYearEnding: 2019
      }])
    })
  })
})
