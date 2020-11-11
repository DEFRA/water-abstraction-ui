'use strict';
const { omit } = require('lodash');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const mappers = require('internal/modules/billing/lib/mappers');

const batch = {
  'invoices': [],
  'id': '31780260-864d-4cb9-8444-0f00848d2680',
  'type': 'two_part_tariff',
  'season': 'all year',
  'status': 'ready',
  'dateCreated': '2020-02-25T16:44:22.827Z',
  'dateUpdated': '2020-02-25T16:45:01.328Z',
  'startYear': {
    'yearEnding': 2020
  },
  'endYear': {
    'yearEnding': 2020
  },
  'region': {
    'type': 'region',
    'id': '35f681b5-2781-4726-b8d1-cd75b96e7747',
    'name': 'Anglian',
    'code': 'A',
    'numericCode': 1
  },
  'totals': {
    'creditNoteCount': 2,
    'invoiceCount': 4,
    'netTotal': '2003'
  }
};

const LICENCE_1 = '01/123/456/A';
const LICENCE_2 = '02/345/678/B';

const invoice = {
  invoiceLicences: [
    {
      id: 'test-invoice-licence-id-1',
      licence: {
        licenceNumber: LICENCE_1
      },
      transactions: [{
        value: 924,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_1'
        },
        volume: 12.35,
        billingVolume: {
          calculatedVolume: 12.35,
          volume: 12.35
        },
        isMinimumCharge: false
      }, {
        value: 1576,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        isMinimumCharge: true
      }],
      hasTransactionErrors: true
    },
    {
      id: 'test-invoice-licence-id-2',
      licence: {
        licenceNumber: LICENCE_2
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
        isMinimumCharge: false
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
        isMinimumCharge: false
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
        isMinimumCharge: false
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
        isMinimumCharge: false
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
        isMinimumCharge: false
      }],
      hasTransactionErrors: false
    }]
};

const documentIdMap = new Map();
documentIdMap.set(LICENCE_1, '7d6a672f-1d3a-414a-81f7-69e66ff1381c');
documentIdMap.set(LICENCE_2, '80b8e0a7-2057-45a4-aad5-fefae0faa43d');

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
}];

experiment('modules/billing/lib/mappers', () => {
  let result;

  experiment('.mapBatchListRow', () => {
    experiment('when batch.externalId is truthy', () => {
      beforeEach(async () => {
        result = mappers.mapBatchListRow({
          ...batch,
          externalId: 1234
        });
      });

      test('human-readable batch type is set', async () => {
        expect(result.batchType).to.equal('Two-part tariff');
      });

      test('bill count sums the creditNoteCount and invoiceCount', async () => {
        expect(result.billCount).to.equal(6);
      });
    });

    experiment('when batch.totals are set', () => {
      beforeEach(async () => {
        result = mappers.mapBatchListRow(batch);
      });

      test('bill count is the sum of the invoices and credit note counts', async () => {
        expect(result.billCount).to.equal(6);
      });
    });

    experiment('when batch.totals are not set', () => {
      beforeEach(async () => {
        result = mappers.mapBatchListRow(omit(batch, 'totals'));
      });

      test('bill count is null', async () => {
        expect(result.billCount).to.equal(null);
      });
    });
  });

  experiment('.mapBatchType', () => {
    test('supplementary is mapped to sentence case', async () => {
      const result = mappers.mapBatchType('supplementary');
      expect(result).to.equal('Supplementary');
    });

    test('annual is mapped to sentence case', async () => {
      const result = mappers.mapBatchType('annual');
      expect(result).to.equal('Annual');
    });

    test('two_part_tariff is mapped to sentence case and hyphenated', async () => {
      const result = mappers.mapBatchType('two_part_tariff');
      expect(result).to.equal('Two-part tariff');
    });
  });

  experiment('.mapInvoiceLicences', () => {
    let data;

    beforeEach(async () => {
      result = mappers.mapInvoiceLicences(invoice, documentIdMap);
    });

    test('the result is an array of items corresponding to the invoiceLicence models', () => {
      expect(result).to.be.an.array().length(2);
      expect(result[0].id).to.equal(invoice.invoiceLicences[0].id);
      expect(result[1].id).to.equal(invoice.invoiceLicences[1].id);
    });

    experiment('for the first invoice licence', () => {
      beforeEach(async () => {
        data = result[0];
      });
      test('has the correct link', async () => {
        expect(data.link).to.equal('/licences/7d6a672f-1d3a-414a-81f7-69e66ff1381c');
      });

      test('has 1 x charge element', async () => {
        expect(data.transactionGroups.length).to.equal(1);
      });

      test('has 1 x transaction in the charge element', async () => {
        expect(data.transactionGroups[0].transactions).to.have.length(1);
      });

      test('has the correct transactions', async () => {
        expect(data.transactionGroups[0].transactions[0]).to.equal({
          value: 924,
          chargePeriod: { startDate: '2019-04-01', endDate: '2020-03-31' },
          volume: 12.35,
          billingVolume: {
            calculatedVolume: 12.35,
            volume: 12.35
          },
          isEdited: false,
          isMinimumCharge: false
        });
      });

      test('has the correct charge element total', async () => {
        expect(data.transactionGroups[0].totals).to.equal({
          debits: 924,
          credits: 0,
          netTotal: 924
        });
      });

      test('has the correct value', async () => {
        const { value } = data.transactionGroups[0].transactions[0];
        expect(value).to.equal(924);
      });

      test('has the correct charge period', async () => {
        const { chargePeriod } = data.transactionGroups[0].transactions[0];
        expect(chargePeriod).to.equal({ startDate: '2019-04-01', endDate: '2020-03-31' });
      });

      test('has the correct volumes', async () => {
        const { volume, billingVolume } = data.transactionGroups[0].transactions[0];
        expect(volume).to.equal(12.35);
        expect(billingVolume.calculatedVolume).to.equal(12.35);
        expect(billingVolume.volume).to.equal(12.35);
      });

      test('has isEdited flag false because the two volumes are the same', async () => {
        const { isEdited } = data.transactionGroups[0].transactions[0];
        expect(isEdited).to.be.false();
      });

      test('has the correct minimum charge transactions', async () => {
        expect(data.minimumChargeTransactions[0]).to.equal({
          value: 1576,
          chargePeriod: { startDate: '2019-04-01', endDate: '2020-03-31' },
          isMinimumCharge: true
        });
      });

      experiment('for the second invoice licence', () => {
        beforeEach(async () => {
          data = result[1];
        });

        test('has 2 x charge element', async () => {
          expect(data.transactionGroups.length).to.equal(2);
        });

        experiment('the first charge element', async () => {
          test('has 1 x transaction', async () => {
            expect(data.transactionGroups[0].transactions).to.have.length(1);
          });

          experiment('the transaction', () => {
            test('has isEdited flag true as the volume is different to the calculated volume', async () => {
              const { volume, billingVolume, isEdited } = data.transactionGroups[0].transactions[0];
              expect(volume).to.equal(12.35);
              expect(billingVolume.calculatedVolume).to.equal(null);
              expect(billingVolume.volume).to.equal(12.35);
              expect(isEdited).to.equal(true);
            });
          });

          test('has the correct totals', async () => {
            const { totals } = data.transactionGroups[0];
            expect(totals).to.equal({ debits: 1234, credits: 0, netTotal: 1234 });
          });
        });

        test('handles no billing volume', async () => {
          expect(data.transactionGroups[1].transactions[3].billingVolume).to.be.undefined();
          expect(data.transactionGroups[1].transactions[3].isEdited).to.be.false();
        });
      });
    });
  });

  experiment('.mapInvoices', () => {
    beforeEach(async () => {
      result = mappers.mapInvoices(batch, [invoice]);
    });

    test('results contain the invoice', () => {
      expect(result[0]).to.include(invoice);
    });

    experiment('group', () => {
      test('is set to "otherAbstractors" when isWaterUndertaker is false', () => {
        invoice.isWaterUndertaker = false;
        result = mappers.mapInvoices(batch, [invoice]);
        expect(result[0].group).to.equal('otherAbstractors');
      });

      test('is set to "waterUndertakers" when isWaterUndertaker is true', () => {
        invoice.isWaterUndertaker = true;
        result = mappers.mapInvoices(batch, [invoice]);
        expect(result[0].group).to.equal('waterUndertakers');
      });
    });

    experiment('isCredit', () => {
      test('is set to false when invoice netTotal is positive', () => {
        invoice.netTotal = 123;
        result = mappers.mapInvoices(batch, [invoice]);
        expect(result[0].isCredit).to.be.false();
      });

      test('is set to true when invoice netTotal is negative', () => {
        invoice.netTotal = -123;
        result = mappers.mapInvoices(batch, [invoice]);
        expect(result[0].isCredit).to.be.true();
      });
    });

    experiment('sortValue is set correctly ', () => {
      test('for a positive netTotal', () => {
        invoice.netTotal = 123;
        result = mappers.mapInvoices(batch, [invoice]);
        expect(result[0].sortValue).to.equal(-123);
      });

      test('for a negative netTotal', () => {
        invoice.netTotal = -123;
        result = mappers.mapInvoices(batch, [invoice]);
        expect(result[0].sortValue).to.equal(-123);
      });
    });
  });

  experiment('.mapInvoiceLevelErrors', () => {
    beforeEach(async () => {
      result = mappers.mapInvoiceLevelErrors(invoice);
    });

    test('maps to an array of error objects for invoice licences with errors', async () => {
      expect(result).to.equal([{
        id: 'test-invoice-licence-id-1',
        message: 'There are problems with transactions on licence 01/123/456/A'
      }]);
    });
  });

  experiment('.mapBatchLevelErrors', () => {
    beforeEach(async () => {
      result = mappers.mapBatchLevelErrors(batch, batchInvoices);
    });

    test('maps to an array of error objects for invoice licences with errors', async () => {
      expect(result).to.equal([{
        link: `/billing/batch/${batch.id}/invoice/test-invoice-id-2`,
        accountNumber: 'B00000000B',
        financialYearEnding: 2019
      }]);
    });
  });
});
