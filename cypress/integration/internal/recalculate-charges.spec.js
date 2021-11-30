const { setUp, tearDown } = require('../../support/setup');

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
  describe('user reviews the licence', () => {
    cy.get('#navbar-bill-runs').contains('Bill runs').click();
  });
};

const selectFirstBillRun = () => {
  describe('user views the bill runs', () => {
    cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Bill runs');
    cy.get('.govuk-table__cell .govuk-link').first().click();
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

const setTwoPartTariffBillingVolume = () => {
  describe('user views returns data', () => {
    cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Review data issues');
    cy.get('.govuk-link').contains('Review').click();
    cy.url().should('contain', '/billing/batch/');
    cy.get('.govuk-heading-xl').contains('Review data issues for L1');
    cy.get('a[href*="billing-volume"]').click();
  });

  describe('user verify the review bill', () => {
    cy.get('#quantity').click();
    cy.url().should('contain', '/billing/batch/');
    cy.get('[type="radio"]').check('authorised');
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

const recalculateBills = (type) => {
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

  describe('user recalculates bills', () => {
    cy.get('.govuk-heading-l').contains('Agreements');
    cy.get('.govuk-table__cell .govuk-link').contains('Recalculate bills').click();
  });

  describe('user marks the licence for the next supplementary run', () => {
    cy.get('.govuk-heading-l').contains(`You're about to mark this licence for the next supplementary bill run`);
    cy.get('.govuk-button').contains('Confirm').click();
  });

  describe('user creates a bill run', () => {
    cy.get('.govuk-panel__title').contains(`You've marked this licence for the next supplementary bill run`);
    cy.get('.govuk-button').contains('Create bill run').click();
  });
};

describe('recalculating charges with no change to charge versions', () => {
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
      recalculateBills(type);
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
      viewBillRuns();
      selectFirstBillRun();
      recalculateBills(type);
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
