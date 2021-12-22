const moment = require('moment');

const getYearStart = () => {
  const yearStart = moment();
  yearStart.set('month', 3); // April
  yearStart.set('date', 1);
  if (moment().month() <= 2) {
    yearStart.subtract(2, 'year');
  } else {
    yearStart.subtract(1, 'year');
  }
  return yearStart;
};

const login = (user, password) => {
  // cy.visit to visit the URL
  cy.visit(Cypress.env('ADMIN_URI'));
  // Enter the user name and Password
  cy.fixture('users.json').then(users => {
    cy.get('input#email').type(users[user]);
  });

  cy.get('#password').type(Cypress.env(password));
  cy.get('.govuk-button.govuk-button--start').click();

  // assert once the user is signed in
  cy.contains('Search');
};

const viewBillRuns = () => {
  // user clicks on bill runs nav to review the licence
  describe('user reviews the bill runs', () => {
    cy.get('.navbar__link').contains('Bill runs').click();
  });
};

const selectFirstBillRun = () => {
  describe('user views the bill runs', () => {
    cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Bill runs');
    cy.get('.govuk-table__cell .govuk-link').first().click();
  });
};

const selectSecondBillRun = () => {
  describe('user views the bill runs', () => {
    cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Bill runs');
    cy.get('.govuk-table__cell .govuk-link').eq(1).click();
  });
};

/**
 * create a bill run
 */
const createBillRun = (type) => {
  describe(`user selects ${type} bill run`, () => {
    switch (type) {
      case 'annual':
        cy.get('input#selectedBillingType').click();
        break;
      case 'supplementary':
        cy.get('input#selectedBillingType-2').click();
        break;
      case 'two-part tariff':
        cy.get('input#selectedBillingType-3').click();
        cy.get('input#twoPartTariffSeason').click();
        break;
    }
    cy.get('button.govuk-button').click();
  });

  describe('user selects the test region', () => {
    cy.get('input#selectedBillingRegion-9').click();
    cy.get('button.govuk-button').click();
  });

  describe('user waits for the batch to finish generating', () => {
    cy.get('.govuk-heading-l').contains(`${type} bill run`);
    cy.url().should('contain', '/processing');
  });
};

const reviewLicence = () => {
  describe('user views returns data', () => {
    cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Review data issues');
    cy.get('.govuk-link').contains('Review').click();
    cy.url().should('contain', '/billing/batch/');
    cy.get('.govuk-heading-xl').contains('Review data issues for L1');
  });
};

const viewChargeInformation = (type) => {
  describe('user views the bill run', () => {
    cy.get('.govuk-heading-xl', { timeout: 20000 }).contains(`Test Region ${type} bill run`);
    cy.get('.govuk-table__cell .govuk-link').contains('View').click();
  });

  describe('user views the licence', () => {
    cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Transactions for 1 licence');
    cy.get('.govuk-link').contains('View licence').click();
  });

  describe('user selects the charge information tab', () => {
    cy.get('.govuk-heading-l').contains('Summary');
    cy.get('.govuk-tabs__tab').contains('Charge information').click();
  });
};

const recalculateBills = () => {
  describe('user recalculates bills', () => {
    cy.get('.govuk-heading-l').contains('Agreements');
    cy.get('.govuk-table__cell .govuk-link').contains('Recalculate bills').click();
  });
};

const markLicenceForNextSupplementaryRun = () => {
  describe('user marks the licence for the next supplementary run', () => {
    cy.get('.govuk-heading-l').contains(`You're about to mark this licence for the next supplementary bill run`);
    cy.get('.govuk-button').contains('Confirm').click();
  });

  describe('user creates a bill run', () => {
    cy.get('.govuk-panel__title').contains(`You've marked this licence for the next supplementary bill run`);
    cy.get('.govuk-button').contains('Create bill run').click();
  });
};

const reviewTwoPartTariffBillingVolume = () => {
  describe('user reviews 2 Part billing volumes data', () => {
    cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Review data issues');
    cy.get('.govuk-link').contains('Review').click();
    cy.url().should('contain', '/billing/batch/');
    cy.get('.govuk-heading-xl').contains('Review data issues for L1');
  });
};

const setTwoPartTariffBillingVolume = (customVolume) => {
  describe('user verify the review bill', () => {
    cy.get('a[href*="billing-volume"]', { timeout: 20000 }).click();
    cy.get('#quantity', { timeout: 20000 }).click();
    cy.url().should('contain', '/billing/batch/');
    if (customVolume) {
      cy.get('[type="radio"]').check('custom');
      cy.get('#customQuantity').type(customVolume).should('be.visible');
    } else {
      cy.get('[type="radio"]').check('authorised');
    }
    cy.get('.govuk-button').contains('Confirm').click();
  });

  describe('user reviews licenses for bill', () => {
    cy.url().should('contain', '/billing/batch/');
    cy.get('.govuk-heading-xl').contains('Review data issues');
    cy.get('.govuk-button').contains('Continue').click();
  });
};

const continueSupplementaryBillRun = (type) => {
  describe(`user generates ${type} bill run`, () => {
    cy.get('.govuk-heading-l').contains(`You're about to generate`);
    cy.get('.govuk-button').contains('Confirm').click();
  });

  describe('user waits for batch to finish generating', () => {
    cy.get('.govuk-heading-l').contains(`Test Region ${type} bill run`);
    cy.url().should('contain', '/processing');
  });
};

const confirmBillRun = (type) => {
  describe('user confirms bill run', () => {
    cy.get('.govuk-heading-xl', { timeout: 20000 }).contains(`Test Region ${type} bill run`);
    cy.get('.govuk-button').contains('Confirm bill run').click();
  });

  describe('user sends the bill run', () => {
    cy.get('.govuk-heading-l').contains('You\'re about to send this bill run');
    cy.get('.govuk-button').contains('Send bill run').click();
  });

  describe('user waits for batch to finish generating', () => {
    cy.get('.govuk-heading-l').contains(`Test Region ${type} bill run`);
    cy.url().should('contain', '/processing');
  });

  describe('user views bill run', () => {
    cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Bill run sent');
    cy.get('#main-content a').contains('Go to bill run').click();
    cy.url().should('contain', '/summary');
  });
};

exports.getYearStart = getYearStart;
exports.login = login;
exports.viewBillRuns = viewBillRuns;
exports.selectFirstBillRun = selectFirstBillRun;
exports.selectSecondBillRun = selectSecondBillRun;
exports.reviewLicence = reviewLicence;
exports.viewChargeInformation = viewChargeInformation;
exports.recalculateBills = recalculateBills;
exports.markLicenceForNextSupplementaryRun = markLicenceForNextSupplementaryRun;
exports.createBillRun = createBillRun;
exports.reviewTwoPartTariffBillingVolume = reviewTwoPartTariffBillingVolume;
exports.setTwoPartTariffBillingVolume = setTwoPartTariffBillingVolume;
exports.continueSupplementaryBillRun = continueSupplementaryBillRun;
exports.confirmBillRun = confirmBillRun;
