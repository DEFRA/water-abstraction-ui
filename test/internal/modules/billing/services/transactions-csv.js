'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

// Test helpers
const GeneralHelper = require('../../../../support/helpers/general.helper.js')

const transactionsCSV = require('internal/modules/billing/services/transactions-csv')

const batch = {
  id: '8ed86390-3557-4cbb-a43f-bd31db5ae119',
  dateCreated: '2020-01-14',
  type: 'two_part_tariff',
  region: {
    displayName: 'South West',
    id: '7c9e4745-c474-41a4-823a-e18c57e85d4c'
  },
  billRunNumber: 2345
}

const invoiceData =
  {
    id: '0817794f-b5b4-47e8-8172-3411bd6165bd',
    isDeMinimis: false,
    billingInvoiceLicences: [
      {
        licenceRef: '1/23/45/*S/6789',
        id: 'e93c4697-f288-491e-b9fe-6cab333bbef5',
        billingTransactions: [
          {
            value: 4005,
            netAmount: 61728,
            isCredit: false,
            agreements: [{ code: 'S130W' }],
            status: 'charge_created',
            id: '6ae19381-7f2b-4504-be94-429c78a71b5c',
            authorisedDays: 152,
            billableDays: 152,
            description: 'The description - with 007',
            transactionKey: 'efab988ba55a9f3a729c672cf76aaee6',
            externalId: 'b97b7fe2-8704-4efa-9f39-277d8df997a0',
            startDate: '2019-04-01',
            endDate: '2020-03-31',
            abstractionPeriod: {
              startDay: 1,
              startMonth: 11,
              endDay: 31,
              endMonth: 3
            },
            billingVolume: [
              {
                calculatedVolume: 10.3,
                volume: 9.1,
                financialYear: 2020
              }
            ],
            isCompensationCharge: false,
            chargeElement: {
              id: '13597728-0390-48b3-8c97-adbc17b6111a',
              chargeVersionId: '967a1db8-e161-4fd7-b45f-9e96db97202e',
              source: 'unsupported',
              eiucSource: 'other',
              season: 'winter',
              loss: 'high',
              authorisedAnnualQuantity: '9.1',
              billableAnnualQuantity: '9.1',
              purposeUse: {
                type: 'use',
                legacyId: '420',
                description: 'Spray Irrigation - Storage'
              }
            },
            volume: 9.1,
            calcEiucFactor: 1,
            calcSucFactor: 1,
            calcSourceFactor: 0.5,
            calcSeasonFactor: 0.5,
            calcLossFactor: 0.5,
            calcEiucSourceFactor: 0.5,
            calcS126Factor: 1.0,
            calcS127Factor: 0.5,
            section130Agreement: 'S130W',
            section127Agreement: false
          },
          {
            value: 4006,
            netAmount: 61728,
            isCredit: false,
            agreements: [],
            status: 'charge_created',
            id: '6ae19381-7f2b-4504-be94-429c78a71b5c',
            authorisedDays: 152,
            billableDays: 152,
            description: 'The description - with 007',
            transactionKey: 'efab988ba55a9f3a729c672cf76aaee6',
            externalId: 'b97b7fe2-8704-4efa-9f39-277d8df997a0',
            chargePeriod: {
              startDate: '2019-04-01',
              endDate: '2020-03-31'
            },
            abstractionPeriod: {
              startDay: 1,
              startMonth: 11,
              endDay: 31,
              endMonth: 3
            },
            isCompensationCharge: false,
            chargeElement: {
              id: '13597728-0390-48b3-8c97-adbc17b6111a',
              chargeVersionId: '967a1db8-e161-4fd7-b45f-9e96db97202e',
              source: 'unsupported',
              season: 'winter',
              loss: 'high',
              abstractionPeriod: {
                startDay: 1,
                startMonth: 11,
                endDay: 31,
                endMonth: 3
              },
              authorisedAnnualQuantity: '9.1',
              billableAnnualQuantity: '9.1',
              purposeUse: {
                type: 'use',
                code: '420',
                name: 'Spray Irrigation - Storage'
              }
            },
            volume: 9.1,
            billingVolume: [
              {
                calculatedVolume: null,
                volume: 9.1
              }
            ],
            isDeMinimis: true,
            calcEiucFactor: 1,
            calcSucFactor: 1,
            calcSourceFactor: 0.5,
            calcSeasonFactor: 0.5,
            calcLossFactor: 0.5,
            calcEiucSourceFactor: 0.5,
            calcS126FactorValue: 1.0,
            calcS127FactorValue: 0.5
          }
        ],
        licence: {
          id: '31679203-f2e5-4d35-b0d1-fcb2745268aa',
          licenceRef: '1/23/45/*S/6789',
          isWaterUndertaker: false,
          region: {
            type: 'region',
            id: '6ad67f32-e75d-48c1-93d5-25a0e6263e78',
            name: 'Anglian',
            displayName: 'Anglian',
            code: 'A',
            numericCode: 1
          },
          regions: {
            historicalAreaCode: 'AREA'
          }
        }
      }
    ],
    invoiceAccount: {
      id: '2f3853a0-61f0-49e4-81ca-60c1a49f665d',
      invoiceAccountNumber: 'A12345678A',
      company: {
        id: 'e8f5db63-fa46-4b25-b193-4f48733524aa',
        name: 'R G Applehead & sons LTD',
        type: 'organisation'
      }
    },
    address: {
      id: '6f9dfbd6-b534-442c-bf30-cb32a53b9a6c',
      town: 'Apple',
      county: 'Appleshire',
      country: 'UK',
      postcode: 'AP9 8RG',
      addressLine1: 'Little  Orchard',
      addressLine2: 'Orchard lane',
      addressLine3: 'Orchard Hill',
      addressLine4: 'The Royal Gala Valley'
    },
    financialYearEnding: 2019,
    netAmount: 123456,
    isCredit: false,
    invoiceNumber: 'IIA123456'
  }

const chargeVersionsData = [{
  id: '967a1db8-e161-4fd7-b45f-9e96db97202e',
  changeReason: {
    description: 'change reason description'
  }
}, {
  id: '02b78cd4-e419-40e3-93f9-f405c9ccc009',
  changeReason: {
    description: 'irrelevant change reason description'
  }
}]

experiment('internal/modules/billing/services/transactions-csv', () => {
  experiment('.createCSV', () => {
    let chargeVersions
    let invoice
    let result

    beforeEach(() => {
      invoice = GeneralHelper.cloneObject(invoiceData)
      chargeVersions = GeneralHelper.cloneObject(chargeVersionsData)
    })

    test('formats each CSV row as expected', async () => {
      result = await transactionsCSV.createCSV([invoice], chargeVersions)

      expect(result[0]['Billing account number']).to.equal('A12345678A')
      expect(result[0]['Customer name']).to.equal('R G Applehead & sons LTD')
      expect(result[0]['Licence number']).to.equal('1/23/45/*S/6789')
      expect(result[0]['Bill number']).to.equal('IIA123456')
      expect(result[0]['Financial year']).to.equal('2019')
      expect(result[0]['Invoice amount']).to.equal('1,234.56')
      expect(result[0]['Credit amount']).to.equal('')
      expect(result[0]['Net transaction line amount(debit)']).to.equal('617.28')
      expect(result[0]['Net transaction line amount(credit)']).to.equal('')
      expect(result[0]['Charge information reason']).to.equal('change reason description')
      expect(result[0].Region).to.equal('Anglian')
      expect(result[0]['De minimis rule Y/N']).to.equal('N')
      expect(result[0]['Transaction description']).to.equal('The description - with 007')
      expect(result[0]['Water company Y/N']).to.equal('N')
      expect(result[0]['Historical area']).to.equal('AREA')
      expect(result[0]['Compensation charge Y/N']).to.equal('N')
      expect(result[0]['Standard Unit Charge (SUC) (£/1000 cubic metres)']).to.equal('1')
      expect(result[0]['Environmental Improvement Unit Charge (EIUC) (£/1000 cubic metres)']).to.equal('1')
      expect(result[0]['Authorised annual quantity (megalitres)']).to.equal('9.1')
      expect(result[0]['Billable annual quantity (megalitres)']).to.equal('9.1')
      expect(result[0]['Source type']).to.equal('unsupported')
      expect(result[0]['Source factor']).to.equal('0.5')
      expect(result[0]['Adjusted source type']).to.equal('other')
      expect(result[0]['Adjusted source factor']).to.equal('0.5')
      expect(result[0].Season).to.equal('winter')
      expect(result[0]['Season factor']).to.equal('0.5')
      expect(result[0].Loss).to.equal('high')
      expect(result[0]['Loss factor']).to.equal('0.5')
      expect(result[0]['Purpose code']).to.equal('420')
      expect(result[0]['Purpose name']).to.equal('Spray Irrigation - Storage')
      expect(result[0]['Abstraction period start date']).to.equal('1 Nov')
      expect(result[0]['Abstraction period end date']).to.equal('31 Mar')
      expect(result[0]['Charge period start date']).to.equal('2019-04-01')
      expect(result[0]['Charge period end date']).to.equal('2020-03-31')
      expect(result[0]['Authorised days']).to.equal('152')
      expect(result[0]['Billable days']).to.equal('152')
      expect(result[0]['Calculated quantity']).to.equal('10.3')
      expect(result[0].Quantity).to.equal('9.1')
      expect(result[0]['S127 agreement (Y/N)']).to.equal('N')
      expect(result[0]['S127 agreement value']).to.equal('0.5')
      expect(result[0]['S130 agreement']).to.equal('S130W')
      expect(result[0]['S130 agreement value']).to.equal('')
    })

    test('creates a line for each transaction', async () => {
      result = await transactionsCSV.createCSV([invoice], chargeVersions)

      expect(result.length).to.equal(invoice.billingInvoiceLicences[0].billingTransactions.length)
    })

    experiment('when the invoice is a debit', () => {
      test("sets 'Invoice amount' and 'Credit amount' correctly", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Invoice amount']).to.equal('1,234.56')
        expect(result[0]['Credit amount']).to.equal('')
      })
    })

    experiment('when the invoice is a credit', () => {
      beforeEach(() => {
        invoice.isCredit = true
        invoice.netAmount = -123456
      })

      test("sets 'Invoice amount' and 'Credit amount' correctly", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Invoice amount']).to.equal('')
        expect(result[0]['Credit amount']).to.equal('-1,234.56')
      })
    })

    experiment('when the transaction is a debit', () => {
      test("sets the 'Net transaction line amount' fields correctly", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Net transaction line amount(debit)']).to.equal('617.28')
        expect(result[0]['Net transaction line amount(credit)']).to.equal('')
      })
    })

    experiment('when the transaction is a credit', () => {
      beforeEach(() => {
        invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
          transaction.isCredit = true
          transaction.netAmount = -61728
        })
      })

      test("sets the 'Net transaction line amount' fields correctly", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Net transaction line amount(debit)']).to.equal('')
        expect(result[0]['Net transaction line amount(credit)']).to.equal('-617.28')
      })
    })

    experiment('when `netAmount` in the transactions is null', () => {
      beforeEach(() => {
        invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
          transaction.netAmount = null
        })
      })

      test("states 'Error - not calculated' in the transaction line amount fields", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Net transaction line amount(debit)']).to.equal('Error - not calculated')
        expect(result[0]['Net transaction line amount(credit)']).to.equal('Error - not calculated')
      })
    })

    experiment('when charge information is missing', () => {
      experiment('such as the charge version not being found', () => {
        beforeEach(() => {
          chargeVersions[0].id = 'notgonnafindme'
        })

        test("sets the 'Charge information reason' to empty", async () => {
          result = await transactionsCSV.createCSV([invoice], chargeVersions)

          expect(result[0]['Charge information reason']).to.equal('')
        })
      })

      experiment('such as the change reason being null', () => {
        beforeEach(() => {
          chargeVersions[0].changeReason = null
        })

        test("sets the 'Charge information reason' to empty", async () => {
          result = await transactionsCSV.createCSV([invoice], chargeVersions)

          expect(result[0]['Charge information reason']).to.equal('')
        })
      })
    })

    experiment('when deminimis is true', () => {
      beforeEach(() => {
        invoice.isDeMinimis = true
      })

      test("sets 'De minimis rule Y/N' to 'Y'", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['De minimis rule Y/N']).to.equal('Y')
      })
    })

    experiment('when water company is true', () => {
      beforeEach(() => {
        invoice.billingInvoiceLicences[0].licence.isWaterUndertaker = true
      })

      test("sets 'Water company Y/N' to 'Y'", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Water company Y/N']).to.equal('Y')
      })
    })

    experiment('when compensation charge is true', () => {
      beforeEach(() => {
        invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
          transaction.isCompensationCharge = true
        })
      })

      test("sets 'Compensation charge Y/N' to 'Y'", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Compensation charge Y/N']).to.equal('Y')
      })
    })

    experiment('when the transaction charge type is minimum charge', () => {
      beforeEach(() => {
        invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
          transaction.chargeType = 'minimum_charge'
        })
      })

      test('drops a number of columns', async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Standard Unit Charge (SUC) (£/1000 cubic metres)']).to.be.undefined()
        expect(result[0]['Environmental Improvement Unit Charge (EIUC) (£/1000 cubic metres)']).to.be.undefined()
        expect(result[0]['Authorised annual quantity (megalitres)']).to.be.undefined()
        expect(result[0]['Billable annual quantity (megalitres)']).to.be.undefined()
        expect(result[0]['Source type']).to.be.undefined()
        expect(result[0]['Source factor']).to.be.undefined()
        expect(result[0]['Adjusted source type']).to.be.undefined()
        expect(result[0]['Adjusted source factor']).to.be.undefined()
        expect(result[0].Season).to.be.undefined()
        expect(result[0]['Season factor']).to.be.undefined()
        expect(result[0].Loss).to.be.undefined()
        expect(result[0]['Loss factor']).to.be.undefined()
        expect(result[0]['Purpose code']).to.be.undefined()
        expect(result[0]['Purpose name']).to.be.undefined()
        expect(result[0]['Abstraction period start date']).to.be.undefined()
        expect(result[0]['Abstraction period end date']).to.be.undefined()
      })
    })

    experiment('when the transaction charge element source type is tidal', () => {
      beforeEach(() => {
        invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
          transaction.chargeElement.source = 'tidal'
        })
      })

      test("sets 'Adjusted source type' to 'tidal'", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['Adjusted source type']).to.equal('tidal')
      })
    })

    experiment('when billing volume data is missing', () => {
      experiment('such as transaction volumn being null', () => {
        beforeEach(() => {
          invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
            transaction.volume = null
          })
        })

        test("sets the 'Calculated quantity' to empty", async () => {
          result = await transactionsCSV.createCSV([invoice], chargeVersions)

          expect(result[0]['Calculated quantity']).to.equal('')
        })
      })

      experiment('such as the billing volumes not having a matching financial year for transaction end date', () => {
        beforeEach(() => {
          invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
            transaction.billingVolume[0].financialYear = 2018
          })
        })

        test("sets the 'Calculated quantity' to empty", async () => {
          result = await transactionsCSV.createCSV([invoice], chargeVersions)

          expect(result[0]['Calculated quantity']).to.equal('')
        })
      })
    })

    experiment('when section 127 agreement is true', () => {
      beforeEach(() => {
        invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
          transaction.section127Agreement = true
        })
      })

      test("sets 'S127 agreement (Y/N)' to 'Y'", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['S127 agreement (Y/N)']).to.equal('Y')
      })
    })

    experiment('when the calculated S127 value is null', () => {
      beforeEach(() => {
        invoice.billingInvoiceLicences[0].billingTransactions.forEach((transaction) => {
          transaction.calcS127Factor = null
        })
      })

      test("sets 'S127 agreement value' to empty", async () => {
        result = await transactionsCSV.createCSV([invoice], chargeVersions)

        expect(result[0]['S127 agreement value']).to.equal('')
      })
    })
  })

  experiment('.getCSVFileName', () => {
    test('returns expected file name', () => {
      const expectedFileName = 'South West two-part tariff bill run 2345.csv'
      const fileName = transactionsCSV.getCSVFileName(batch)
      expect(fileName).to.equal(expectedFileName)
    })
  })
})
