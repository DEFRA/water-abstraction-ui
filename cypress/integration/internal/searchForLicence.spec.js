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
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.psc);
    });
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('.govuk-button.govuk-button--start').click();

    // assert once the user is signed in
    cy.contains('Licences, users and returns');

    // search for a license by using Name
    cy.get('#query').type('Anglian').should('be.visible');
    cy.get('.search__button').click();
    cy.contains('Licences').should('be.visible');
    cy.get('.govuk-table__body').contains('03/28/69/0034').should('be.visible');
    cy.get('.govuk-table__body').contains('03/28/69/0034').click();
    cy.get('.govuk-summary-list__value').contains('Anglian Water Services Ltd').should('be.visible');
    cy.get('.govuk-back-link').click();

    // search for a license by using Alias Name
    cy.get('#query').clear();
    cy.get('#query').type('crumpet').should('be.visible');
    cy.get('.search__button').click();
    cy.contains('Licences').should('be.visible');
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').should('be.visible');
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').click();
    cy.get('.govuk-back-link').click();

    // search for a license by using Licence Number
    cy.get('#query').clear();
    cy.get('#query').type('AT/CURR/WEEKLY/01').should('be.visible');
    cy.get('.search__button').click();
    cy.contains('Licences').should('be.visible');
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').should('be.visible');
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').click();
    cy.get('.govuk-back-link').click();

    //  Click Sign out Button
    cy.get('#signout').click();

    //  assert the signout
    cy.contains('You\'re signed out');
  });
});
