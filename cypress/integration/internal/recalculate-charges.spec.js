const { setUp, tearDown } = require('../../support/setup');
const {
  login,
  viewBillRuns,
  selectFirstBillRun,
  selectSecondBillRun,
  createBillRun,
  confirmBillRun,
  setTwoPartTariffBillingVolume,
  continueSupplementaryBillRun,
  reviewLicence,
  viewChargeInformation,
  recalculateBills,
  markLicenceForNextSupplementaryRun
} = require('../../support/common');

describe('recalculating charges with no change to charge versions', () => {
  before(() => {
    tearDown();
    setUp('five-year-two-part-tariff-bill-runs');
  });

  after(() => {
    tearDown();
  });

  it('user logs in', () => {
    login('billingAndData', 'DEFAULT_PASSWORD');

    describe('user enters the create a new annual bill flow', () => {
      const type = 'annual';
      viewBillRuns();
      cy.get('#main-content > a.govuk-button').contains('Create a bill run').click();
      createBillRun(type);
      confirmBillRun(type);
      viewBillRuns();
      selectFirstBillRun();
      cy.get('h2').contains('£550.20');
    });

    describe('user enters the create a new two-part tariff bill flow', () => {
      const type = 'two-part tariff';
      viewBillRuns();
      cy.get('#main-content > a.govuk-button').contains('Create a bill run').click();
      createBillRun(type);
      setTwoPartTariffBillingVolume(type);
      continueSupplementaryBillRun(type);
      confirmBillRun(type);
      viewChargeInformation(type);
      recalculateBills();
      markLicenceForNextSupplementaryRun();
    });

    describe('user enters the supplementary bill flow', () => {
      const type = 'supplementary';
      createBillRun(type);
      reviewLicence();
      viewBillRuns();
      selectFirstBillRun();

      cy.get('#dataIssues').contains('No returns received');

      setTwoPartTariffBillingVolume(type);
      continueSupplementaryBillRun(type);

      confirmBillRun(type);
    });

    describe('user confirms the bill run has a zero invoice', () => {
      viewBillRuns();
      selectFirstBillRun();
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains(`Test Region supplementary bill run`);
      cy.get('h2').contains('£0.00');
    });

    describe('user recalculates the bills', () => {
      viewBillRuns();
      selectSecondBillRun();
      viewChargeInformation('two-part tariff');
      recalculateBills();
      markLicenceForNextSupplementaryRun();
    });

    describe('user enters the supplementary bill flow', () => {
      const type = 'supplementary';
      createBillRun(type);
      reviewLicence();
      viewBillRuns();
      selectFirstBillRun();
      setTwoPartTariffBillingVolume(type);
      continueSupplementaryBillRun(type);
    });

    describe('user confirms the bill run', () => {
      cy.get('.govuk-error-summary__list li', { timeout: 20000 }).contains('There are no licences ready for this bill run');
    });
  });
});
