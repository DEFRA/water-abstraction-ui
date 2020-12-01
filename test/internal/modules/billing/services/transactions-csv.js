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

const invoicesForBatch = [
  {
    id: '0817794f-b5b4-47e8-8172-3411bd6165bd',
    invoiceLicences: [
      {
        id: 'e93c4697-f288-491e-b9fe-6cab333bbef5',
        transactions: [
          {
            value: 4005,
            isCredit: false,
            agreements: [{ code: '126' }, { code: '127' }, { code: '130W' }],
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
            isCompensationCharge: false,
            chargeElement: {
              id: '13597728-0390-48b3-8c97-adbc17b6111a',
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
            billingVolume: {
              calculatedVolume: 10.3,
              volume: 9.1
            },
            isDeMinimis: false
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
            isCompensationCharge: false,
            chargeElement: {
              id: '13597728-0390-48b3-8c97-adbc17b6111a',
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
            billingVolume: {
              calculatedVolume: null,
              volume: 9.1
            },
            isDeMinimis: true
          }
        ],
        licence: {
          id: '31679203-f2e5-4d35-b0d1-fcb2745268aa',
          licenceNumber: '1/23/45/*S/6789',
          isWaterUndertaker: false,
          region: {
            type: 'region',
            id: '6ad67f32-e75d-48c1-93d5-25a0e6263e78',
            name: 'Anglian',
            displayName: 'Anglian',
            code: 'A',
            numericCode: 1
          },
          historicalArea: {
            type: 'EAAR',
            code: 'AREA'
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
      addressLine4: 'The Royal Gala Valey'
    }
  }
];

experiment('internal/modules/billing/services/transactions-csv', async () => {
  experiment('_getTransactionData', async () => {
    const transaction = invoicesForBatch[0].invoiceLicences[0].transactions[0];
    test('returns expected transaction data', async () => {
      const transactionData = transactionsCSV._getTransactionData(transaction);
      expect(transactionData.value).to.equal('40.05');

      expect(transactionData.isCredit).to.equal(false);
      expect(transactionData.isCompensationCharge).to.equal(false);
      expect(transactionData.source).to.equal(transaction.chargeElement.source);
      expect(transactionData.season).to.equal(transaction.chargeElement.season);
      expect(transactionData.loss).to.equal(transaction.chargeElement.loss);
      expect(transactionData.description).to.equal(transaction.description);
      expect(transactionData.agreements).to.equal('126, 127, 130W');
      expect(transactionData.chargePeriodStartDate).to.equal(transaction.chargePeriod.startDate);
      expect(transactionData.chargePeriodEndDate).to.equal(transaction.chargePeriod.endDate);
      expect(transactionData.authorisedDays).to.equal(transaction.authorisedDays);
      expect(transactionData.billableDays).to.equal(transaction.billableDays);
      expect(transactionData.absPeriodStartDate).to.equal('1 Nov');
      expect(transactionData.absPeriodEndDate).to.equal('31 Mar');
      expect(transactionData.authorisedAnnualQuantity).to.equal(transaction.chargeElement.authorisedAnnualQuantity);
      expect(transactionData.billableAnnualQuantity).to.equal(transaction.chargeElement.billableAnnualQuantity);
      expect(transactionData.volume).to.equal(transaction.volume);
      expect(transactionData.calculatedVolume).to.equal(transaction.billingVolume.calculatedVolume);
      expect(transactionData.isDeMinimis).to.equal(transaction.isDeMinimis);
    });

    test('handles multiple agreements', async () => {
      const transactionData = transactionsCSV._getTransactionData({
        ...transaction,
        agreements: [{ code: '126' }, { code: '127' }, { code: '130W' }]
      });
      expect(transactionData.agreements).to.equal('126, 127, 130W');
    });

    test('handles undefined billing volume', async () => {
      const transactionData = transactionsCSV._getTransactionData({
        ...transaction,
        billingVolume: undefined
      });
      expect(transactionData.calculatedVolume).to.be.null();
    });

    test('handles minimum charge transactions', async () => {
      const minChargeTransaction = {
        value: 1468,
        isCredit: false,
        agreements: [],
        status: 'candidate',
        startDate: '2019-04-01',
        endDate: '2020-03-31',
        externalId: 'b97b7fe2-8704-4efa-9f39-277d8df997a0',
        description:
         'Minimum Charge Calculation - raised under Schedule 23 of the Environment Act 1995',
        isCompensationCharge: false,
        isMinimumCharge: true,
        isDeMinimis: false,
        isNewLicence: true,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31' }
      };

      const transactionData = transactionsCSV._getTransactionData(minChargeTransaction);
      expect(transactionData.value).to.equal('14.68');
      expect(transactionData.isCredit).to.equal(false);
      expect(transactionData.isCompensationCharge).to.equal(false);
      expect(transactionData.description).to.equal(minChargeTransaction.description);
      expect(transactionData.agreements).to.equal('');
      expect(transactionData.chargePeriodStartDate).to.equal(minChargeTransaction.chargePeriod.startDate);
      expect(transactionData.chargePeriodEndDate).to.equal(minChargeTransaction.chargePeriod.endDate);
      expect(transactionData.isDeMinimis).to.equal(minChargeTransaction.isDeMinimis);
    });
  });

  experiment('_getInvoiceAccountData', async () => {
    const invoiceAccount = invoicesForBatch[0].invoiceAccount;
    test('returns transaction data in expected order', async () => {
      const invoiceAccountData = transactionsCSV._getInvoiceAccountData(invoiceAccount);
      expect(invoiceAccountData.accountNumber).to.equal(invoiceAccount.accountNumber);
      expect(invoiceAccountData.companyName).to.equal(invoiceAccount.company.name);
    });
  });

  experiment('.createCSV', async () => {
    let csvData;
    const expectedKeys = [
      'licenceNumber',
      'region',
      'isWaterUndertaker',
      'historicalArea',
      'value',
      'isCredit',
      'isCompensationCharge',
      'source',
      'season',
      'chargeElementPurposeCode',
      'chargeElementPurposeName',
      'loss',
      'description',
      'agreements',
      'chargePeriodStartDate',
      'chargePeriodEndDate',
      'authorisedDays',
      'billableDays',
      'absPeriodStartDate',
      'absPeriodEndDate',
      'authorisedAnnualQuantity',
      'billableAnnualQuantity',
      'calculatedVolume',
      'volume',
      'accountNumber',
      'companyName'
    ];

    beforeEach(async () => {
      csvData = await transactionsCSV.createCSV(invoicesForBatch);
    });

    test('csvData includes the all the required data keys', async () => {
      expect(Object.keys(csvData[0])).to.include(expectedKeys);
    });

    test('includes the tail data', async () => {
      expect(csvData[0].licenceNumber).to.equal('1/23/45/*S/6789');
      expect(csvData[0].region).to.equal('Anglian');
      expect(csvData[0].isWaterUndertaker).to.equal('false');
      expect(csvData[0].historicalArea).to.equal('AREA');
      expect(csvData[0].accountNumber).to.equal(invoicesForBatch[0].invoiceAccount.accountNumber);
      expect(csvData[0].companyName).to.equal(invoicesForBatch[0].invoiceAccount.company.name);
    });

    test('creates a line for each transaction', async () => {
      const licenceNumber = invoicesForBatch[0].invoiceLicences[0].licence.licenceNumber;
      expect(csvData[0].licenceNumber).to.equal(licenceNumber);
      expect(csvData[1].licenceNumber).to.equal(licenceNumber);
    });
  });

  experiment('.getCSVFileName', () => {
    test('returns expected file name', () => {
      const expectedFileName = `South West two-part tariff bill run 2345.csv`;
      const fileName = transactionsCSV.getCSVFileName(batch);
      expect(fileName).to.equal(expectedFileName);
    });
  });
});
