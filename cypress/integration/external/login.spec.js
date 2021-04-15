const { setUp, tearDown } = require('../../support/setup');

describe('User Login and Log out', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('User login and logout', () => {
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

    //  Click Sign out Button
    cy.get('#signout').click();

    //  assert the signout
    cy.contains('You are signed out').should('be.visible');
  });
});
