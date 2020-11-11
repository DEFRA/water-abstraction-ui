'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { getBatchFinancialYearEnding } = require('internal/modules/billing/lib/batch-financial-year');
const types = require('internal/modules/billing/lib/bill-run-types');

experiment('internal/modules/billing/lib/batch-financial-year', () => {
  experiment('.getBatchFinancialYearEnding', () => {
    experiment('for an annual batch', () => {
      test('returns the current financial year', async () => {
        expect(
          getBatchFinancialYearEnding(types.ANNUAL, false, '2020-03-31')
        ).to.equal(2020);

        expect(
          getBatchFinancialYearEnding(types.ANNUAL, false, '2020-04-01')
        ).to.equal(2021);

        expect(
          getBatchFinancialYearEnding(types.ANNUAL, false, '2021-03-31')
        ).to.equal(2021);
      });
    });

    experiment('for a supplementary batch', () => {
      test('returns the current financial year', async () => {
        expect(
          getBatchFinancialYearEnding(types.SUPPLEMENTARY, false, '2020-03-31')
        ).to.equal(2020);

        expect(
          getBatchFinancialYearEnding(types.SUPPLEMENTARY, false, '2020-04-01')
        ).to.equal(2021);

        expect(
          getBatchFinancialYearEnding(types.SUPPLEMENTARY, false, '2021-03-31')
        ).to.equal(2021);
      });
    });

    experiment('for a winter/all year two-part tariff batch batch', () => {
      test('returns the financial year of the most recent cycle where the due date has passed', async () => {
        expect(
          getBatchFinancialYearEnding(types.TWO_PART_TARIFF, false, '2020-10-17')
        ).to.equal(2020);

        expect(
          getBatchFinancialYearEnding(types.TWO_PART_TARIFF, false, '2020-10-16')
        ).to.equal(2019);
      });
    });

    experiment('for a summer two-part tariff batch batch', () => {
      test('returns the financial year of the most recent cycle where the due date has passed', async () => {
        expect(
          getBatchFinancialYearEnding(types.TWO_PART_TARIFF, true, '2020-11-29')
        ).to.equal(2021);

        expect(
          getBatchFinancialYearEnding(types.TWO_PART_TARIFF, true, '2020-11-28')
        ).to.equal(2020);
      });
    });
  });
});
