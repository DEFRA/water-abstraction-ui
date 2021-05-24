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
      cy.contains('Licences, users and returns');
      // user clicks on manage link to set up the two-part-tariff bill run
      describe('user clicks on Manage link', () => {
        cy.get('#navbar-notifications').click();
      });

      describe('user enters the create a new bill flow', () => {
        cy.get('.govuk-link').eq(12).contains('Create a bill run').click();
      });

      describe('user selects two-part-tariff billing type', () => {
        cy.get('#selectedBillingType-3').click();
        cy.get('#twoPartTariffSeason-2').click();
        cy.get('button.govuk-button').click();
      });

      describe('user selects the test region', () => {
        cy.get('.govuk-radios__item').last().children().first().click();
        cy.get('button.govuk-button').click();
      });

      describe('user waits for batch to finish generating', () => {
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Review licences with returns data issues');
        cy.url().should('contain', '/two-part-tariff-review');
      });
      
      describe('user view returns data', () => {
        cy.get('.govuk-link').contains('Review').click();
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-xl').contains('Review returns data issues for L1');
        cy.get(':nth-child(6) > a').contains('Change').click();

        // click on back
       // cy.get('.govuk-back-link').click();
      });

      describe('user verifys the review bill', () => {
        cy.get('#quantity').click();
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-xl').contains('Review quantity to bill for CE2');
        cy.get('.govuk-button').contains('Continue').click();
        // click on back
       // cy.get('.govuk-back-link').click();
      });
 
      describe('user confirms the review bill', () => {
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-caption-l').contains('Licence L1');
        cy.get('.govuk-button').contains('Continue').click();
       // click on back
       // cy.get('.govuk-back-link').click();
      });

      describe('user reviews licenses for bill', () => {
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-xl').contains('Review licences with returns data issues');
        cy.get('.govuk-button').contains('Continue').click();
       // click on back
       // cy.get('.govuk-back-link').click();
      });
  
      describe('user genrates the bill', () => {
        cy.url().should('contain', '/billing/batch/');
        cy.get('.govuk-heading-l',{ timeout: 20000 }).contains('You are about to generate the two-part tariff bills');
        cy.get('.govuk-button').contains('Confirm').click();
        });

        describe('user waits for batch to generate', () => {
           cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Two-part tariff bill run');
          cy.url().should('contain', '/billing/batch/');
        });

      describe('user confirms the bill', () => {
        cy.url().should('contain', '/billing/batch/');
         cy.get('.govuk-heading-xl',{ timeout: 20000 }).contains('Two-part tariff bill run');
        cy.get('.govuk-button').contains('Confirm bill run').click();
      });

      describe('send the bill run', () => {
        cy.get('.govuk-heading-l').contains('You are about to send this bill run');
        cy.get('.govuk-button').contains('Send bill run').click();
      });

      describe('verify the bill run is sent successfully', () => {
        // cy.get('.govuk-heading-l', { timeout: 40000 }).contains('Two-part tariff bill run');
        cy.get('.govuk-panel__title', { timeout: 40000 }).contains('Bill run sent');
        cy.url().should('contain', '/confirm');
        cy.get('div.govuk-grid-column-two-thirds').eq(1).contains('Download the bill run');
      });
    });
   });
  });
