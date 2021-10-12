const { setUp, tearDown } = require('../../support/setup');

describe('rebilling annual bill run', () => {
  beforeEach(() => {
    tearDown();
    setUp('annual-billing-2');
  });

  afterEach(() => {
    tearDown();
  });

  it('user logs in and generates annual bill', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      // assert once the user is signed in
      cy.get('.govuk-label').contains('Search').should('be.visible');
      cy.get('#search-hint').contains('Enter a licence number, customer name, returns ID, registered email address or monitoring station').should('be.visible');

      describe('user enters the create a new bill flow', () => {
        cy.get('#navbar-bill-runs').click();
        cy.contains('Bill runs').should('be.visible');
        cy.contains('Create a supplementary, annual or two-part tariff bill run.').should('be.visible');
        cy.get('#main-content > a.govuk-button').contains('Create a bill run').click();
      });

      describe('user selects annual billing type', () => {
        cy.get('[type="radio"]').check('annual');
        cy.get('button.govuk-button').click();
      });

      describe('user selects the test region', () => {
        cy.get('[type="radio"]#selectedBillingRegion-9').last().check();
        cy.get('button.govuk-button').click();
      });

      describe('user generates the annual bill and verifys that bill sent succesfully', () => {
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Annual bill run');
        cy.url().should('contain', '/summary');
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Annual bill run');
        cy.url().should('contain', '/summary');
        cy.get('#tab_other-abstractors').click();
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
        cy.get('.govuk-heading-l').should('contain', 'You\'re about to send this bill run');
        cy.get('button.govuk-button').click();
        cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Bill run sent');
        cy.get('div.govuk-grid-column-two-thirds').eq(1).children(3).contains('Go to bill run').click();
        cy.get('.govuk-heading-xl').contains('Annual bill run');
        cy.get('#tab_other-abstractors').click();
        cy.get(':nth-child(5) > .govuk-link').click();
        cy.get('.govuk-details__summary').contains('Billing account details').click();
        cy.get('div.govuk-details__text').contains('Billing account A99999999A').click();
      });

      describe('user marks the bill for reissue and confirms', () => {
        cy.get('p > .govuk-button').contains('Reissue a bill').should('be.visible');
        cy.get('p > .govuk-button').click();
        cy.get('#fromDate-day').type('01');
        cy.get('#fromDate-month').type('09');
        cy.get('#fromDate-year').type('2017');
        cy.get('form > .govuk-button').click();
        // confirm rebill
        cy.get('form > .govuk-button').click();
        // asserting the bill reissue
        cy.get('.govuk-panel').should('contain', 'You’ve marked 1 bill for reissue');
        cy.get('.govuk-grid-column-full > .govuk-button').contains('Create a supplementary bill run').should('be.visible');
        cy.get(':nth-child(6) > .govuk-link').contains('Return to billing account').should('be.visible');
      });

      describe('user creates the supplementary bill for the bills marks reissue', () => {
        cy.get('.govuk-grid-column-full > .govuk-button').click();
        cy.get('#selectedBillingType-2').click();
        cy.get('form > .govuk-button').click();
        cy.get('#selectedBillingRegion-9').check();
        cy.get('form > .govuk-button').click();
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('bill run');
        // confirm and send the bill
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
        cy.get('form > .govuk-button').contains('Send bill run').click();
        cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Bill run sent');
      });

      describe('user asserts the rebilling generated from supplementary bill run', () => {
        cy.get('.govuk-grid-column-two-thirds').contains('Go to bill run').click();
        cy.get('#main-content').contains('2022').should('be.visible');
      });
    });
  });
});
