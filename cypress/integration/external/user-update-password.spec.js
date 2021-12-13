const { setUp, tearDown } = require('../../support/setup');

describe('User update password', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('login user and confirm changes', () => {
    //  cy.visit to visit the URL
    cy.visit(Cypress.env('USER_URI'));

    // tap the sign in button on the welcome page
    cy.get('a[href*="/signin"]').click();

    //  Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.external);
    });
    cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));

    //  Click Sign in Button
    cy.get('.govuk-button.govuk-button--start').click();

    //  assert once the user is signed in
    cy.contains('Add licences or give access');

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
