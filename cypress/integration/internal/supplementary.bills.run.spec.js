const { setUp, tearDown } = require('../../support/setup');
const LICENCE_NUMBER = 'AT/CURR/DAILY/01';

describe('supplementary bill run', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
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
        cy.get('.govuk-link').eq(12).contains('Create a bill run').click();
        cy.get('#selectedBillingType').click();
        cy.get('button.govuk-button').click();
        cy.get('#selectedBillingRegion').click();
        cy.get('button.govuk-button').click();
        
      });
    });
  });
});
