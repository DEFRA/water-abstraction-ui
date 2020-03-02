'use strict';

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
        }
      }, {
        value: 3456,
        chargePeriod: {
          startDate: '2019-04-01',
          endDate: '2020-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_b'
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
        }
      }, {
        value: 789,
        chargePeriod: {
          startDate: '2020-04-01',
          endDate: '2021-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_b'
        }
      }, {
        value: 916,
        chargePeriod: {
          startDate: '2020-04-01',
          endDate: '2021-03-31'
        },
        chargeElement: {
          id: 'charge_element_licence_2_b'
        }
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

    experiment('when batch.externalId is truthy', () => {
      beforeEach(async () => {
        result = mappers.mapBatchListRow(batch);
      });

      test('human-readable batch type is set', async () => {
        expect(result.batchType).to.equal('Two-part tariff');
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
      console.log(JSON.stringify(result, null, 2));
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
            chargePeriod: { startDate: '2019-04-01', endDate: '2020-03-31' }
          });
        });

        test('has the correct totals', async () => {
          expect(data.chargeElements[0].totals).to.equal({ debits: 924, credits: 0, netTotal: 924 });
        });
      });
    });
  });
});
