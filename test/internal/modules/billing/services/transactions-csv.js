const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const transactionsCSV = require('internal/modules/billing/services/transactions-csv');

const batch = {
  id: '8ed86390-3557-4cbb-a43f-bd31db5ae119',
  billRunDate: '2020-01-14',
  type: 'supplementary',
  region: {
    name: 'South West',
    id: '7c9e4745-c474-41a4-823a-e18c57e85d4c'
  }
};
const chargeElement = {
  source: 'unsupported',
  season: 'all year',
  loss: 'medium',
  abstractionPeriod: {
    startDay: 1,
    startMonth: 4,
    endDay: 31,
    endMonth: 10
  },
  authorisedAnnualQuantity: 498,
  billableAnnualQuantity: null
};

const invoicesForBatch = [{
  id: '8ed86390-3557-4cbb-a43f-bd31db5ae119',
  invoiceLicences: [{
    transactions: [{
      value: -1421,
      isCredit: true,
      authorisedDays: 182,
      billableDays: 56,
      agreements: [],
      chargePeriod: {
        startDate: '2019-04-01',
        endDate: '2020-03-31'
      },
      isCompensationCharge: false,
      description: 'credit following licence changes',
      chargeElement: chargeElement
    }, {
      value: 1285,
      isCredit: false,
      authorisedDays: 182,
      billableDays: 56,
      agreements: ['130U'],
      chargePeriod: {
        startDate: '2019-04-01',
        endDate: '2020-03-31'
      },
      isCompensationCharge: false,
      description: 'charge following licence changes',
      chargeElement: chargeElement
    }],
    id: '27b5b202-287b-4314-a013-b2b6d904161f',
    address: {
      id: '8fc7a9fd-7e2a-4fd3-9c1c-372ae78b52b4',
      address_1: 'Unit 1, South West Business Park',
      address_2: '78 Testing Road',
      town: 'Bristol',
      county: 'Bristol',
      postcode: 'BS1 2AB'
    },
    company: {
      id: '530d40da-7355-44ba-9468-5500d3e8fe47',
      type: 'organisation',
      name: 'South West Water Ltd'
    },
    contact: {
      id: 'fd690f49-9f2c-4e1b-8ed3-885868c14a32',
      salutation: 'Mr',
      firstName: 'Bob',
      lastName: 'Jones'
    },
    licence: {
      id: 'e99cdef3-e264-4e1f-bf58-1fe6b22c8d78',
      licenceNumber: '01/234/567'
    }
  }],
  invoiceAccount: {
    id: 'a764b68a-0167-4f8c-82b1-da08824c2683',
    accountNumber: 'A12345678A',
    company: {
      id: '530d40da-7355-44ba-9468-5500d3e8fe47',
      type: 'organisation',
      name: 'South West Water Ltd'
    }
  }
}];

experiment('internal/modules/billing/services/transactions-csv', async () => {
  experiment('_getTransactionData', async () => {
    const transaction = invoicesForBatch[0].invoiceLicences[0].transactions[1];
    test('returns transaction data in expected order', async () => {
      const transactionData = transactionsCSV._getTransactionData(transaction);
      expect(transactionData[0]).to.equal(transaction.value);
      expect(transactionData[1]).to.equal(transaction.isCredit.toString());
      expect(transactionData[2]).to.equal(transaction.isCompensationCharge.toString());
      expect(transactionData[3]).to.equal(transaction.chargeElement.source);
      expect(transactionData[4]).to.equal(transaction.chargeElement.season);
      expect(transactionData[5]).to.equal(transaction.chargeElement.loss);
      expect(transactionData[6]).to.equal(transaction.description);
      expect(transactionData[7]).to.equal(transaction.agreements[0]);
      expect(transactionData[8]).to.equal(transaction.chargePeriod.startDate);
      expect(transactionData[9]).to.equal(transaction.chargePeriod.endDate);
      expect(transactionData[10]).to.equal(transaction.authorisedDays);
      expect(transactionData[11]).to.equal(transaction.billableDays);
      expect(transactionData[12]).to.equal('1 Apr');
      expect(transactionData[13]).to.equal('31 Oct');
      expect(transactionData[14]).to.equal(transaction.chargeElement.authorisedAnnualQuantity);
      expect(transactionData[15]).to.equal(transaction.chargeElement.billableAnnualQuantity);
    });

    test('handles mutliple agreements', async () => {
      const transactionData = transactionsCSV._getTransactionData({
        ...transaction,
        agreements: ['126', '127', '130W']
      });
      expect(transactionData[7]).to.equal('126, 127, 130W');
    });
  });

  experiment('_getInvoiceLicenceData', async () => {
    let invoiceLicenceData;
    beforeEach(async () => {
      invoiceLicenceData = transactionsCSV._getInvoiceLicenceData(invoicesForBatch[0].invoiceLicences[0]);
    });

    test('returns expected address data as string', () => {
      const { id, ...address } = invoicesForBatch[0].invoiceLicences[0].address;
      const expectedAddressString = JSON.stringify(address);
      expect(invoiceLicenceData[0]).to.equal(expectedAddressString);
    });

    test('returns expected company data as string', () => {
      const { id, type, ...company } = invoicesForBatch[0].invoiceLicences[0].company;
      const expectedCompanyString = JSON.stringify(company);
      expect(invoiceLicenceData[1]).to.equal(expectedCompanyString);
    });
  });

  experiment('.createCSV', async () => {
    let csvData;
    beforeEach(async () => {
      csvData = await transactionsCSV.createCSV(invoicesForBatch);
    });

    test('csvData starts with headings', async () => {
      expect(csvData[0]).to.equal(transactionsCSV._columnHeadings);
    });

    test('creates a line for each transaction', async () => {
      const licenceNumber = invoicesForBatch[0].invoiceLicences[0].licence.licenceNumber;
      expect(csvData[1][0]).to.equal(licenceNumber);
      expect(csvData[2][0]).to.equal(licenceNumber);
    });
  });

  experiment('.getCSVFileName', () => {
    test('returns expected file name', () => {
      const expectedFileName = `${batch.region.name} ${batch.type} bill run ${batch.billRunDate.slice(0, 10)}.csv`;
      // South West supplementary bill run 2020-01-14.csv

      const fileName = transactionsCSV.getCSVFileName(batch);
      expect(fileName).to.equal(expectedFileName);
    });
  });
});
