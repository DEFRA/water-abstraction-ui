const { setUp, tearDown } = require('../../support/setup');

describe('supplementary bill run', () => {
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
      cy.contains('Licences, users and returns');
      // user clicks on manage link to set up the supplementary bill run
      describe('user clicks on Manage link', () => {
        cy.get('#navbar-notifications').click();
      });

      describe('user enters the create a new bill flow', () => {
        cy.get('.govuk-link').eq(12).contains('Create a bill run').click();
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
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Supplementary bill run');
        cy.url().should('contain', '/summary');
      });

      describe('user verifys the generated bill', () => {
        cy.get('.govuk-link').eq(4).click();
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-caption-l').contains('Billing account');
        cy.get('div.meta__row').eq(1).contains('Test Region');
        // click on back
        cy.get('.govuk-back-link').click();
      });

      describe('user confirms the bill', () => {
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
      });

      describe('send the bill run', () => {
        cy.get('.govuk-heading-l').contains('You are about to send this bill run');
        cy.get('button.govuk-button').contains('Send bill run').click();
      });

      describe('verify the bill run is sent successfully', () => {
        cy.get('.govuk-heading-l', { timeout: 40000 }).contains('supplementary bill run');
        cy.get('.govuk-panel__title', { timeout: 40000 }).contains('Bill run sent');
        cy.url().should('contain', '/confirm');
        cy.get('div.govuk-grid-column-two-thirds').eq(1).contains('Download the bill run');
      });
    });
  });
});
