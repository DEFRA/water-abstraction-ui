const { setUp, tearDown } = require('../../support/setup');

describe('search for licences as internal user', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
  });

  after(() => {
    tearDown();
  });

  it('user logs in and searches for a License', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));

    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.psc);
    });
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));

    // Click Sign in Button
    cy.get('.govuk-button.govuk-button--start').click();

    // assert once the user is signed in
    cy.contains('Licences, users and returns');

    // search for a license
    cy.get('#query').type('Anglian').should('be.visible');
    cy.get('.search__button').click();
    cy.contains('Licences').should('be.visible');

    //  Click Sign out Button
    cy.get('#signout').click();

    //  assert the signout
    cy.contains('You\'re signed out');
  });
});
