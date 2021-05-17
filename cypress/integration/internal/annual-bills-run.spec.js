const { setUp, tearDown } = require('../../support/setup');

describe('annual bill run', () => {
  before(() => {
    tearDown();
    setUp('annual-billing');
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

      describe('user selects annual billing type', () => {
        cy.get('#selectedBillingType').click();
        cy.get('button.govuk-button').click();
      });

      describe('user cancels the bill after generating it', () => {
        cy.get('.govuk-radios__item').last().children().first().click();
        cy.get('button.govuk-button').click();
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Annual bill run');
        cy.url().should('contain', '/summary');
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(1).contains('Cancel bill run').click();
        cy.get('form > .govuk-button').click();
        cy.get('.pagination__link').click();
        cy.get('.pagination__link').click();
        cy.get('#main-content > a.govuk-button').click();
      }); 
      
      describe('user generates the annual bill ', () => {
        cy.get('#selectedBillingType').click();
        cy.get('form > .govuk-button').click();
        cy.get('.govuk-radios__item').last().children().first().click();
        cy.get('button.govuk-button').click();
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Annual bill run');
        cy.url().should('contain', '/summary');
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
        cy.get('.govuk-heading-l').should('contain', 'You are about to send this bill run');
        cy.get('form > .govuk-button').click();
        cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Bill run sent');
        cy.get('.govuk-grid-column-two-thirds > :nth-child(4) > a').click();
        cy.get('.govuk-heading-xl').contains('Annual bill run');
      }); 

      describe('user verifies the annual bill ', () => {
        cy.get('#navbar-notificationsType').click();
        //cy.get('form > .govuk-button').click();
        //cy.get('.govuk-radios__item').last().children().first().click();
        //cy.get('button.govuk-button').click();
        //cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Annual bill run');
        //cy.url().should('contain', '/summary');
        //cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
  
      }); 


      /*describe('user verifys the generated bill', () => {
        cy.get('.govuk-grid-column-two-thirds > :nth-child(4) > a').click();
        cy.get('.govuk-heading-xl').contatins('Annual bill run');
        //cy.get('.govuk-body > .govuk-tag').contains('SENT');
      });*/

      /* describe('user confirms the bill', () => {
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
      }); */

      /* describe('send the bill run', () => {
        cy.get('.govuk-heading-l').contains('You are about to send this bill run');
        cy.get('button.govuk-button').contains('Send bill run').click();
      }); */

      /* describe('verify the bill run is sent successfully', () => {
        cy.get('.govuk-heading-l', { timeout: 40000 }).contains('supplementary bill run');
        cy.get('.govuk-panel__title', { timeout: 40000 }).contains('Bill run sent');
        cy.url().should('contain', '/confirm');
        cy.get('div.govuk-grid-column-two-thirds').eq(1).contains('Download the bill run');
      }); */
    });
  });
});
