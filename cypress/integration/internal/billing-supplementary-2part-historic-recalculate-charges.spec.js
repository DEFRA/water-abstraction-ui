const { setUp, tearDown } = require('../../support/setup');
const {
  login,
  viewBillRuns,
  createBillRun,
  confirmBillRun,
  setTwoPartTariffBillingVolume,
  continueSupplementaryBillRun,
  reviewLicence,
  viewChargeInformation,
  recalculateBills,
  markLicenceForNextSupplementaryRun,
  reviewTwoPartTariffBillingVolume
} = require('../../support/common');

const recalculateChargesTest = (customVolume = 25) => {
  // describe('user enters the create a new annual bill flow', () => {
  //   const type = 'annual';
  //   viewBillRuns();
  //   cy.get('#main-content > a.govuk-button').contains('Create a bill run').click();
  //   createBillRun(type);
  //   confirmBillRun(type);
  //   viewBillRuns();
  //   selectFirstBillRun();
  //   cy.get('h2').contains('£550.20');
  // });

  describe('user enters the create a new two-part tariff bill flow', () => {
    const type = 'two-part tariff';
    viewBillRuns();
    cy.get('#main-content > a.govuk-button').contains('Create a bill run').click();
    createBillRun(type);
    reviewTwoPartTariffBillingVolume();
    cy.get('.govuk-table__body > :nth-child(2) > :nth-child(3) > a', { timeout: 20000 }).click();
    setTwoPartTariffBillingVolume(customVolume);
    continueSupplementaryBillRun(type);
    confirmBillRun(type);
    viewChargeInformation('L1');
    recalculateBills();
    markLicenceForNextSupplementaryRun();
  });

  describe('user enters the supplementary bill flow', () => {
    const type = 'supplementary';
    createBillRun(type);
    reviewLicence();
    cy.get(':nth-child(7) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click();
    setTwoPartTariffBillingVolume(customVolume);
    cy.get(':nth-child(10) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click();
    setTwoPartTariffBillingVolume(customVolume);
    cy.get(':nth-child(13) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click();
    setTwoPartTariffBillingVolume(customVolume);
    cy.get(':nth-child(16) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click();
    setTwoPartTariffBillingVolume(customVolume);
    cy.get(':nth-child(19) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click();
    setTwoPartTariffBillingVolume(customVolume);
    continueSupplementaryBillRun(type);
  });
};

describe('recalculating charges', () => {
  beforeEach(() => {
    tearDown();
    setUp('five-annual-four-two-part-bill-runs');
    login('billingAndData', 'DEFAULT_PASSWORD');
  });

  afterEach(() => {
    cy.get('#signout').click();
    tearDown();
  });

  it('with no change to charge versions', () => {
    recalculateChargesTest();
    cy.get('.govuk-list > li', { timeout: 20000 }).contains('There are no licences ready for this bill run. Check there are licences ready to be billed and try again.');
  });

  it('with change to less volume in charge versions', () => {
    recalculateChargesTest('15');
    confirmBillRun('supplementary');
    cy.get('.govuk-grid-column-two-thirds h2', { timeout: 20000 }).contains('-£880.32');
  });

  it('with change to greater volume in charge versions', () => {
    recalculateChargesTest('30');
    confirmBillRun('supplementary');
    cy.get('.govuk-grid-column-two-thirds h2', { timeout: 20000 }).contains('£440.16');
  });
});
