const { setUp, tearDown } = require('../../support/setup');

describe('two-part-tariff bill run', () => {
  before(() => {
    tearDown();
    setUp('two-part-tariff-billing-data');
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
      cy.contains('Search');

      // user clicks on manage link to set up the two-part-tariff bill run
      describe('user clicks on Manage link', () => {
        cy.get('#navbar-notifications').click();
      });

      describe('user enters the create a new bill flow', () => {
        cy.get('#navbar-bill-runs').contains('Bill runs').click();
        cy.get('#main-content > a.govuk-button').contains('Create a bill run').click();
      });

      describe('user selects two-part-tariff billing type', () => {
        cy.get('[type="radio"]').check('two_part_tariff');
        cy.get('[type="radio"]').check('summer');
        cy.get('button.govuk-button').click();
      });

      describe('user selects the test region', () => {
        cy.get('[type="radio"]#selectedBillingRegion-9').last().check();
        cy.get('button.govuk-button').click();
      });

      describe('user waits for batch to finish generating', () => {
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Review data issues');
        cy.url().should('contain', '/two-part-tariff-review');
      });

      describe('user view returns data', () => {
        cy.get('.govuk-link').contains('Review').click();
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-xl').contains('Review data issues for L1');
        cy.get('a[href*="billing-volume"]').click();
      });

      describe('user verifys the review bill', () => {
        cy.get('#quantity').click();
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-l').contains('Set the billable returns quantity for this bill run');
        cy.get('.govuk-caption-l').contains('Spray Irrigation - Direct, CE2');
        cy.get('[type="radio"]').check('authorised');
        cy.get('.govuk-button').contains('Confirm').click();
      });

      describe('user reviews licenses for bill', () => {
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-xl').contains('Review data issues');
        cy.get('.govuk-button').contains('Continue').click();
      });

      describe('user genrates the bill', () => {
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-l', { timeout: 20000 }).contains('You\'re about to generate the two-part tariff bills');
        cy.get('.govuk-button').contains('Confirm').click();
      });

      describe('user waits for batch to generate', () => {
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('two-part tariff bill run');
        cy.url().should('contain', '/billing/batch/');
      });

      describe('user confirms the bill', () => {
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('two-part tariff bill run');
        cy.get('.govuk-button').contains('Confirm bill run').click();
      });

      describe('send the bill run', () => {
        cy.get('.govuk-heading-l').contains('You\'re about to send this bill run');
        cy.get('.govuk-button').contains('Send bill run').click();
      });

      describe('verify the bill run is sent successfully', () => {
        cy.get('.govuk-panel__title', { timeout: 40000 }).contains('Bill run sent');
        cy.url().should('contain', '/confirm');
        cy.get('div.govuk-grid-column-two-thirds').eq(1).contains('Download the bill run');
      });
    });
  });
});
