const { setUp, tearDown } = require('../../support/setup');

describe('Internal user update password', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('login internal user and confirm changes', () => {
    cy.visit(Cypress.env('ADMIN_URI'));
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.psc);
    });
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('.govuk-button.govuk-button--start').click();

    // Click account settings
    cy.get('a[href*="/account"]').click();

    // Click update password link in header 
    cy.get('a[href*="/account/update-password"]').click();

    // Enter account password and press continue
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('button').contains('Continue').should('have.class', 'govuk-button').click();

    // Enter and Confirm new password 
    cy.get('form').within(($form) => {
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('#confirm-password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.root().submit()
    })
  });

});