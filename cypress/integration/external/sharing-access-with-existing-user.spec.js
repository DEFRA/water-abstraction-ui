const { setUp, tearDown } = require('../../support/setup');

describe('External user sharing license access with another external user ', () => {
  beforeEach(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('User login and assing the license to another external user', () => {
    //  User logs in
    cy.visit(Cypress.env('USER_URI'));
    cy.get('a[href*="/signin"]').click();
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.external);
    });
    cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('.govuk-button.govuk-button--start').click();

    //  view and assign the licence
    cy.get('.licence-result__column > a').contains('AT/CURR/DAILY/01').should('be.visible');
    cy.get('#navbar-manage').contains('Add licences or give access').click();
    cy.get('.govuk-list').contains('Give or remove access to your licence information').click();
    cy.get('.govuk-grid-column-two-thirds > .govuk-button').click();
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.externalAccessSharing);
    });
    cy.get('.form > .govuk-button').click();
    cy.get('.govuk-link').contains('Return to give access').click();
    cy.get('#signout').click();
    //
    describe('Login to check the license assigned ', () => {
      cy.visit(Cypress.env('USER_URI'));
      cy.get('a[href*="/signin"]').click();
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.externalAccessSharing);
      });
      cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      // assert the assigned licence
      cy.get('.licence-result__column > a').contains('AT/CURR/DAILY/01').should('be.visible');

      // Sign out
      cy.get('#signout').click();
    });
  });
});
