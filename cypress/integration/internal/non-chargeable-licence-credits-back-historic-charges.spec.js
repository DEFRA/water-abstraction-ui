const {tearDown, setUp} = require("../../support/setup");
const {
  getYearStart,
  login,
  viewBillRuns,
  createBillRun,
  confirmBillRun,
  selectFirstBillRun,
  setTwoPartTariffBillingVolume,
  continueSupplementaryBillRun,
  viewChargeInformation, reviewLicence
} = require("../../support/common");

describe('non-chargeable licence credits back historic charges', () => {
  before(() => {
    tearDown();
    setUp('two-part-tariff-billing-data');
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
    });

    describe('user makes a licence non chargeable', () => {
      const type = 'two-part tariff';
      viewChargeInformation(type);
      cy.get('#main-content a.govuk-button').contains('Make licence non-chargeable').click();
      cy.get('[type="radio"]#reason').check();
      cy.get('button.govuk-button').contains('Continue').click();
      cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Enter effective date');
      cy.get('[type="radio"]#startDate-2').check();
      const yearStart = getYearStart();
      cy.get('#customDate-day').type(`${yearStart.date()}`);
      cy.get('#customDate-month').type(`${yearStart.month() + 1}`);
      cy.get('#customDate-year').type(`${yearStart.year()}`);
      cy.get('button.govuk-button').contains('Continue').click();
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Check charge information');
      cy.get('button.govuk-button').contains('Confirm').click();
      cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Charge information complete');
      cy.get('.govuk-link').contains('View charge information').click();
      cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Charge information');
      cy.get('.govuk-table .govuk-link').contains('Review').click();
      cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Do you want to approve this charge information?');
      cy.get('[type="radio"]#reviewOutcome').check();
      cy.get('button.govuk-button').contains('Continue').click();
    });

    describe('user enters the supplementary bill flow', () => {
      const type = 'supplementary';
      viewBillRuns();
      cy.get('#main-content > a.govuk-button').contains('Create a bill run').click();
      createBillRun(type);
    });

    describe('user proves the credit has been created', () => {
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Test Region supplementary bill run');
      cy.get('h2 > div > div').should('contain.text', '-£1,100.40');
    });
  });
});