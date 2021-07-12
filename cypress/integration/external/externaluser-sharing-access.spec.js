const { setUp, tearDown } = require('../../support/setup');

describe('External user sharing license access with another external user ', () => {
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
    cy.get('#navbar-manage').contains('Add licences or give access').click();
    cy.get(':nth-child(2) > .govuk-list > li > .govuk-link').click();
    cy.get('.govuk-grid-column-two-thirds > .govuk-button').click();
    //cy.get(':nth-child(1) > .govuk-list > :nth-child(1) > .govuk-link').click();
    //cy.get('#licence_no').type('AT/CURR/DAILY/01');
    //cy.get('form > .govuk-button').click();
    //  Click Sign out Button
    //cy.get('#signout').click();

    //  assert the signout
    //cy.contains(`You're signed out`).should('be.visible');
  });
});
