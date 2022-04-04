const { setUp, tearDown } = require('../../support/setup');

describe('rebilling supplementary bill run', () => {
  before(() => {
    tearDown();
    setUp('supplementary-billing');
  });

  after(() => {
    tearDown();
  });

  it('user logs in', () => {
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

      describe('user selects supplementary billing type', () => {
        cy.get('#selectedBillingType-2').click();
        cy.get('button.govuk-button').click();
      });

      describe('user selects the test region', () => {
        cy.get('.govuk-radios__item').last().children().first().click();
        cy.get('button.govuk-button').click();
      });

      describe('user waits for batch to finish generating', () => {
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('supplementary bill run');
        cy.url().should('contain', '/summary');
      });

      describe('user verifys the generated bill', () => {
        cy.get('.govuk-link').eq(4).click();
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-caption-l').contains('Billing account');
        cy.get('div.meta__row').contains('Test Region');
        // click on back
        cy.get('.govuk-back-link').click();
      });

      describe('user confirms the bill', () => {
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
      });

      describe('send the bill run', () => {
        cy.get('.govuk-heading-l').contains('You\'re about to send this bill run');
        cy.get('button.govuk-button').contains('Send bill run').click();
      });

      describe('verify the bill run is sent successfully', () => {
        cy.get('.govuk-heading-l', { timeout: 20000 }).contains('supplementary bill run');
        cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Bill run sent');
        cy.url().should('contain', '/confirm');
        cy.get('div.govuk-grid-column-two-thirds').eq(1).contains('Download the bill run');
      });
      describe('user mark a licence for rebill, confirms and asserts', () => {
        // going to bill run
        cy.get('.govuk-grid-column-two-thirds').contains('Go to bill run').click();
        cy.get(':nth-child(1) > :nth-child(6) > .govuk-link').contains('View').click();
        cy.get('.govuk-details__summary').contains('Billing account details').click();
        cy.get('div.govuk-details__text').contains('Billing account A99999999A').click();
        // asserting the reissue button exists and clicking, enter the dates for the reissue
        cy.get('p > .govuk-button').contains('Reissue a bill').should('be.visible');
        cy.get('p > .govuk-button').click();
        // enter the dates for the rebilling.,
        cy.get('#fromDate-day').type('01');
        cy.get('#fromDate-month').type('09');
        cy.get('#fromDate-year').type('2017');
        cy.get('form > .govuk-button').click();
        // confirm rebill
        cy.get('form > .govuk-button').click();
        // asserting the bill reissue
        cy.get('.govuk-panel').should('contain', 'You’ve marked 6 bills for reissue');
      });
      describe('user generates the supplementary bill for the marked rebilling licences', () => {
        cy.get('.govuk-grid-column-full > .govuk-button').contains('Create a supplementary bill run').should('be.visible');
        cy.get(':nth-child(6) > .govuk-link').contains('Return to billing account').should('be.visible');
        // creating supplimentary bill for rebill
        cy.get('.govuk-grid-column-full > .govuk-button').click();
        // run billing
        cy.get('#selectedBillingType-2').click();
        cy.get('form > .govuk-button').click();
        cy.get('#selectedBillingRegion-10').check();
        cy.get('form > .govuk-button').click();
        cy.get('.govuk-heading-xl', { timeout: 40000 }).contains('bill run');
        // confirm and send the bill
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
        cy.get('form > .govuk-button').contains('Send bill run').click();
        cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Bill run sent');
      });
      describe('user asserts the rebilling generated from supplementary bill run', () => {
        cy.get('.govuk-grid-column-two-thirds').contains('Go to bill run').click();
        cy.get('#main-content').contains('2018').should('be.visible');
      });
    });
  });
});
