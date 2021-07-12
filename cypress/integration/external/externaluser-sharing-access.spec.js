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

    //  assign the licence
    cy.get('#navbar-manage').contains('Add licences or give access').click();
    cy.get(':nth-child(2) > .govuk-list > li > .govuk-link').click();
    cy.get('.govuk-grid-column-two-thirds > .govuk-button').click();
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.externalNew);
    });
    cy.get('.form > .govuk-button').click();
    cy.get(':nth-child(3) > .govuk-link').click();

    //  Click Sign out Button
    cy.get('#signout').click();

    describe('Login to check the license assigned ', () => {
      cy.visit(Cypress.env('USER_URI'));
      cy.get('a[href*="/signin"]').click();
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.externalNew);
      });
      cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));
  
      //  Click Sign in Button
      cy.get('.govuk-button.govuk-button--start').click();
    });
  });


  // Login to check the license assigned

  
});


