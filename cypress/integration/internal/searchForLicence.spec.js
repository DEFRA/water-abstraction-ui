const { setUp, tearDown } = require('../../support/setup');

describe('User Login', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
  });

  after(() => {
    tearDown();
  });

  it('Try to login', () => {
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
    cy.contains('Licences');
  });
});
