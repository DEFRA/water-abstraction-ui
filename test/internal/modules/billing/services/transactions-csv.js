'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const transactionsCSV = require('internal/modules/billing/services/transactions-csv');

const batch = {
  id: '8ed86390-3557-4cbb-a43f-bd31db5ae119',
  dateCreated: '2020-01-14',
  type: 'two_part_tariff',
  region: {
    displayName: 'South West',
    id: '7c9e4745-c474-41a4-823a-e18c57e85d4c'
  },
  billRunNumber: 2345
};

const invoice =
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
            section127Agreement: true
          },
          {
            value: 4006,
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
      accountNumber: 'A12345678A',
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
    netAmount: 123456
  };

const chargeVersions = [{
  id: '967a1db8-e161-4fd7-b45f-9e96db97202e',
  changeReason: {
    description: 'change reason description'
  }
}, {
  id: '02b78cd4-e419-40e3-93f9-f405c9ccc009',
  changeReason: {
    description: 'irrelevant change reason description'
  }
}];

experiment('internal/modules/billing/services/transactions-csv', () => {
  experiment('_getTransactionData maps', () => {
    let transaction, transactionData;
    beforeEach(() => {
      transaction = invoice.billingInvoiceLicences[0].billingTransactions[0];
      transactionData = transactionsCSV._getTransactionData(transaction);
    });

    test('description as is', () => {
      expect(transactionData.description).to.equal(transaction.description);
    });

    test('compensation charge as Y/N to user friendly heading', () => {
      expect(transactionData['Compensation charge Y/N']).to.equal('N');
    });

    test('charge element data to user friendly headings', () => {
      expect(transactionData['Standard Unit Charge (SUC) (£/1000 cubic metres)']).to.equal(transaction.calcSucFactor);
      expect(transactionData['Environmental Improvement Unit Charge (EIUC) (£/1000 cubic metres)']).to.equal(transaction.calcEiucFactor);
      expect(transactionData['Authorised annual quantity (megalitres)']).to.equal(transaction.chargeElement.authorisedAnnualQuantity);
      expect(transactionData['Billable annual quantity (megalitres)']).to.equal(transaction.chargeElement.billableAnnualQuantity);
      expect(transactionData['Source type']).to.equal(transaction.chargeElement.source);
      expect(transactionData['Source factor']).to.equal(transaction.calcSourceFactor);
      expect(transactionData['Adjusted source type']).to.equal(transaction.chargeElement.eiucSource);
      expect(transactionData['Adjusted source factor']).to.equal(transaction.calcEiucSourceFactor);
      expect(transactionData.Season).to.equal(transaction.chargeElement.season);
      expect(transactionData['Season factor']).to.equal(transaction.calcSeasonFactor);
      expect(transactionData.Loss).to.equal(transaction.chargeElement.loss);
      expect(transactionData['Loss factor']).to.equal(transaction.calcLossFactor);
      expect(transactionData['Purpose code']).to.equal(transaction.chargeElement.purposeUse.legacyId);
      expect(transactionData['Purpose name']).to.equal(transaction.chargeElement.purposeUse.description);
      expect(transactionData['Abstraction period start date']).to.equal('1 Nov');
      expect(transactionData['Abstraction period end date']).to.equal('31 Mar');
    });

    test('agreement to user friendly heading', () => {
      expect(transactionData['S130 agreement']).to.equal('S130W');
      expect(transactionData['S130 agreement value']).to.equal(null);
    });

    test('charge period to user friendly headings', () => {
      expect(transactionData['Charge period start date']).to.equal(transaction.startDate);
      expect(transactionData['Charge period end date']).to.equal(transaction.endDate);
    });

    test('authorised days to user friendly heading', () => {
      expect(transactionData['Authorised days']).to.equal(transaction.authorisedDays);
    });

    test('billable days to user friendly heading', () => {
      expect(transactionData['Billable days']).to.equal(transaction.billableDays);
    });

    test('quantities to user friendly heading', () => {
      expect(transactionData.Quantity).to.equal(transaction.volume);
      expect(transactionData['Calculated quantity']).to.equal(transaction.billingVolume[0].calculatedVolume);
    });

    test('handles multiple agreements', async () => {
      const transactionData = transactionsCSV._getTransactionData({
        ...transaction,
        agreements: [{ code: 'S130W' }]
      });
      expect(transactionData['S127 agreement (Y/N)']).to.equal('Y');
      expect(transactionData['S127 agreement value']).to.equal(0.5);
      expect(transactionData['S130 agreement']).to.equal('S130W');
      expect(transactionData['S130 agreement value']).to.equal(null);
    });

    test('handles undefined billing volume', async () => {
      const transactionData = transactionsCSV._getTransactionData({
        ...transaction,
        billingVolume: []
      });
      expect(transactionData['Calculated quantity']).to.be.null();
    });

    test('handles minimum charge transactions', async () => {
      const minChargeTransaction = {
        value: 1468,
        isCredit: false,
        agreements: [],
        section130Agreement: null,
        section127Agreement: null,
        status: 'candidate',
        startDate: '2019-04-01',
        endDate: '2020-03-31',
        externalId: 'b97b7fe2-8704-4efa-9f39-277d8df997a0',
        description:
         'Minimum Charge Calculation - raised under Schedule 23 of the Environment Act 1995',
        isCompensationCharge: true,
        isMinimumCharge: true,
        isNewLicence: true,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        billingVolume: []
      };

      const transactionData = transactionsCSV._getTransactionData(minChargeTransaction);
      expect(transactionData.description).to.equal(minChargeTransaction.description);
      expect(transactionData['Compensation charge Y/N']).to.equal('Y');
      expect(transactionData['S127 agreement (Y/N)']).to.equal('N');
      expect(transactionData['S127 agreement value']).to.equal(null);
      expect(transactionData['S130 agreement']).to.equal(null);
      expect(transactionData['S130 agreement value']).to.equal(null);
      expect(transactionData['Charge period start date']).to.equal(minChargeTransaction.chargePeriod.startDate);
      expect(transactionData['Charge period end date']).to.equal(minChargeTransaction.chargePeriod.endDate);
    });
  });

  experiment('_getInvoiceData', () => {
    let invoiceData;
    beforeEach(() => {
      invoiceData = transactionsCSV._getInvoiceData(invoice);
    });

    experiment('invoice number', () => {
      test('is mapped to user friendly heading when present', async () => {
        invoiceData = transactionsCSV._getInvoiceData({
          ...invoice, invoiceNumber: 'IIA123456'
        });
        expect(invoiceData['Bill number']).to.equal('IIA123456');
      });
    });

    test('maps financial year to user friendly heading', async () => {
      expect(invoiceData['Financial year']).to.equal(invoice.financialYearEnding);
    });

    experiment('maps invoice total as expected when', () => {
      experiment('invoice amounts come from CM', () => {
        test('and the total is positive', async () => {
          expect(invoiceData['Invoice amount']).to.equal('1,234.56');
          expect(invoiceData['Credit amount']).to.equal(null);
        });

        test('and the total is negative', async () => {
          invoice.netAmount = -123456;
          invoice.isCredit = true;
          invoiceData = transactionsCSV._getInvoiceData(invoice);

          expect(invoiceData['Invoice amount']).to.equal(null);
          expect(invoiceData['Credit amount']).to.equal('-1,234.56');
        });
      });

      experiment('invoice amounts come from WRLS', () => {
        test('and the isCredit flag is false', async () => {
          invoice.netAmount = 123456;
          invoice.isCredit = false;
          invoiceData = transactionsCSV._getInvoiceData(invoice);

          expect(invoiceData['Invoice amount']).to.equal('1,234.56');
          expect(invoiceData['Credit amount']).to.equal(null);
        });

        test('and the isCredit flag is true', async () => {
          invoice.netAmount = -123456;
          invoice.isCredit = true;
          invoiceData = transactionsCSV._getInvoiceData(invoice);

          expect(invoiceData['Invoice amount']).to.equal(null);
          expect(invoiceData['Credit amount']).to.equal('-1,234.56');
        });
      });
    });
  });

  experiment('_getInvoiceAccountData', () => {
    let invoiceAccount, invoiceAccountData;
    beforeEach(() => {
      invoiceAccount = invoice.invoiceAccount;
      invoiceAccountData = transactionsCSV._getInvoiceAccountData(invoiceAccount);
    });

    test('maps account number to user friendly heading', async () => {
      expect(invoiceAccountData['Billing account number']).to.equal(invoiceAccount.accountNumber);
    });

    test('maps account number to user friendly heading', async () => {
      expect(invoiceAccountData['Customer name']).to.equal(invoiceAccount.company.name);
    });
  });

  experiment('_getTransactionAmounts', () => {
    test('when value is a number, value is mapped to relevant line', async () => {
      const transactionLines = transactionsCSV._getTransactionAmounts({ netAmount: 123456, isCredit: false });
      expect(transactionLines['Net transaction line amount(debit)']).to.equal('1,234.56');
      expect(transactionLines['Net transaction line amount(credit)']).to.be.null();
    });

    test('when value is null, an error message is mapped to both lines', async () => {
      const transactionLines = transactionsCSV._getTransactionAmounts({ netAmount: null });
      expect(transactionLines['Net transaction line amount(debit)']).to.equal('Error - not calculated');
      expect(transactionLines['Net transaction line amount(credit)']).to.equal('Error - not calculated');
    });
  });

  experiment('.createCSV', () => {
    let csvData;

    beforeEach(async () => {
      csvData = await transactionsCSV.createCSV([invoice], chargeVersions);
    });

    test('licence number is mapped to user friendly heading', async () => {
      expect(csvData[0]['Licence number']).to.equal('1/23/45/*S/6789');
    });

    test('correct charge information reason is mapped', async () => {
      expect(csvData[0]['Charge information reason']).to.equal('change reason description');
    });

    test('region is mapped to user friendly heading', async () => {
      expect(csvData[0].Region).to.equal('Anglian');
    });

    test('de minimis is mapped to user friendly heading', async () => {
      expect(csvData[0]['De minimis rule Y/N']).to.equal('N');
    });

    test('description is mapped to user friendly heading', async () => {
      expect(csvData[0]['Transaction description']).to.equal('The description - with 007');
    });

    test('water company when false is mapped to user friendly heading', async () => {
      expect(csvData[0]['Water company Y/N']).to.equal('N');
    });

    test('water company when true is mapped to user friendly heading', async () => {
      invoice.billingInvoiceLicences[0].licence.isWaterUndertaker = true;
      csvData = await transactionsCSV.createCSV([invoice], chargeVersions);
      expect(csvData[0]['Water company Y/N']).to.equal('Y');
    });

    test('DeMinimis is mapped to user friendly heading', async () => {
      csvData = await transactionsCSV.createCSV([
        {
          ...invoice,
          isDeMinimis: true
        }
      ], chargeVersions);
      expect(csvData[0]['De minimis rule Y/N']).to.equal('Y');
    });

    test('historical area is mapped to user friendly heading', async () => {
      expect(csvData[0]['Historical area']).to.equal('AREA');
    });

    test('creates a line for each transaction', async () => {
      const licenceRef = invoice.billingInvoiceLicences[0].licence.licenceRef;
      expect(csvData[0]['Licence number']).to.equal(licenceRef);
      expect(csvData[1]['Licence number']).to.equal(licenceRef);
    });
  });

  experiment('.getCSVFileName', () => {
    test('returns expected file name', () => {
      const expectedFileName = 'South West two-part tariff bill run 2345.csv';
      const fileName = transactionsCSV.getCSVFileName(batch);
      expect(fileName).to.equal(expectedFileName);
    });
  });
});
