const { setUp, tearDown } = require('../../support/setup');
const {
  login,
  viewBillRuns,
  selectFirstBillRun,
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

const recalculateChargesTest = ({ customVolume, expectedTotal }) => {
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
    reviewTwoPartTariffBillingVolume();
    setTwoPartTariffBillingVolume(25);
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
    setTwoPartTariffBillingVolume(customVolume);
    continueSupplementaryBillRun(type);
    confirmBillRun(type);

    cy.get('.govuk-grid-column-two-thirds h2', { timeout: 20000 }).contains(expectedTotal);
  });
};

describe('recalculating charges', () => {
  beforeEach(() => {
    tearDown();
    setUp('five-year-two-part-tariff-bill-runs');
    login('billingAndData', 'DEFAULT_PASSWORD');
  });

  afterEach(() => {
    cy.get('#signout').click();
    tearDown();
  });

  it('with no change to charge versions', () => {
    recalculateChargesTest({ customVolume: '25', expectedTotal: '£0.00' });
  });

  it('with change to less volume in charge versions', () => {
    recalculateChargesTest({ customVolume: '15', expectedTotal: '-£220.08' });
  });

  it('with change to greater volume in charge versions', () => {
    // Note authorised is 30 so custom volume will not be passed into the test
    recalculateChargesTest({ expectedTotal: '110.04' });
  });
});
