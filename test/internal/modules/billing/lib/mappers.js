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
        }
      }]
    },
    {
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
        }
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
        }
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
        }
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
        }
      }, {
        value: 916,
        chargePeriod: {
          startDate: '2020-04-01',
          endDate: '2021-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_b'
        },
        volume: 12.35
      }]
    }]
};

const documentIdMap = new Map();
documentIdMap.set(LICENCE_1, '7d6a672f-1d3a-414a-81f7-69e66ff1381c');
documentIdMap.set(LICENCE_2, '80b8e0a7-2057-45a4-aad5-fefae0faa43d');

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

  experiment('.mapInvoiceTransactions', () => {
    let data;
    beforeEach(async () => {
      result = mappers.mapInvoiceTransactions(invoice, documentIdMap);
    });

    test('items are grouped first by financial year', () => {
      expect(Object.keys(result)).to.only.include(['2020', '2021']);
    });

    experiment('in financial year ending 2020', () => {
      experiment('licence 1', () => {
        beforeEach(async () => {
          data = result['2020'][LICENCE_1];
        });

        test('has the correct link', async () => {
          expect(data.link).to.equal('/licences/7d6a672f-1d3a-414a-81f7-69e66ff1381c');
        });

        test('has 1 x charge element', async () => {
          expect(data.chargeElements.length).to.equal(1);
        });

        test('has 1 x transaction in the charge element', async () => {
          expect(data.chargeElements[0].transactions).to.have.length(1);
        });

        test('has the correct transactions', async () => {
          expect(data.chargeElements[0].transactions[0]).to.equal({
            value: 924,
            chargePeriod: { startDate: '2019-04-01', endDate: '2020-03-31' },
            volume: 12.35,
            billingVolume: {
              calculatedVolume: 12.35,
              volume: 12.35
            },
            isEdited: false
          });
        });

        test('has the correct value', async () => {
          const { value } = data.chargeElements[0].transactions[0];
          expect(value).to.equal(924);
        });

        test('has the correct charge period', async () => {
          const { chargePeriod } = data.chargeElements[0].transactions[0];
          expect(chargePeriod).to.equal({ startDate: '2019-04-01', endDate: '2020-03-31' });
        });

        test('has the correct volumes', async () => {
          const { volume, billingVolume } = data.chargeElements[0].transactions[0];
          expect(volume).to.equal(12.35);
          expect(billingVolume.calculatedVolume).to.equal(12.35);
          expect(billingVolume.volume).to.equal(12.35);
        });

        test('has isEdited flag false because the two volumes are the same', async () => {
          const { isEdited } = data.chargeElements[0].transactions[0];
          expect(isEdited).to.be.false();
        });

        test('has the correct totals', async () => {
          const { totals } = data.chargeElements[0];
          expect(totals).to.equal({ debits: 924, credits: 0, netTotal: 924 });
        });
      });

      experiment('licence 2', () => {
        beforeEach(async () => {
          data = result['2020'][LICENCE_2];
        });

        test('has 2 x charge element', async () => {
          expect(data.chargeElements.length).to.equal(2);
        });

        experiment('the first charge element', async () => {
          test('has 1 x transaction', async () => {
            expect(data.chargeElements[0].transactions).to.have.length(1);
          });

          experiment('the transaction', () => {
            test('has isEdited flag true as the volume is different to the calculated volume', async () => {
              const { volume, billingVolume, isEdited } = data.chargeElements[0].transactions[0];
              expect(volume).to.equal(12.35);
              expect(billingVolume.calculatedVolume).to.equal(null);
              expect(billingVolume.volume).to.equal(12.35);
              expect(isEdited).to.equal(true);
            });
          });
        });

        experiment('handles no billing volume', async () => {
          test('has 1 x transaction', async () => {
            const data = result['2021'][LICENCE_2];

            expect(data.chargeElements[0].transactions[1].billingVolume).to.be.undefined();
            expect(data.chargeElements[0].transactions[1].isEdited).to.be.false();
          });
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

    experiment('when minimum charge does not apply', () => {
      test('netTotal is set to invoice netTotal', () => {
        expect(result[0].netTotal).to.equal(invoice.netTotal);
      });
    });

    experiment('when minimum charge applies', () => {
      test('netTotal is set to the minimum charge', () => {
        invoice.netTotal = 1230;
        invoice.minimumChargeApplies = true;
        result = mappers.mapInvoices(batch, [invoice]);
        expect(result[0].netTotal).to.equal(2500);
      });
    });
  });
});
