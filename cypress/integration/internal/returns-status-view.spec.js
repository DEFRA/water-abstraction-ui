const { setUp, tearDown } = require('../../support/setup');

describe('check for different status for a licence in returns tab as internal user', () => {
  before(() => {
    tearDown();
    setUp('barebones');
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

    // search for a license by using Licence Number
    cy.get('#query').clear();
    cy.get('#query').type('AT/CURR/MONTHLY/02').should('be.visible');
    cy.get('.search__button').click();
    cy.contains('Licences').should('be.visible');
    cy.get('.govuk-table__row').contains('AT/CURR/MONTHLY/02').click();

    // Click on returns tab to see status
    describe('sees the Summary table', () => {
      cy.get('#summary').should('be.visible');
    });

    describe('it clicks on the returns tab link', () => {
      cy.get('#tab_returns').click();
    });
    describe('sees the returns table', () => {
      cy.get('#returns').should('be.visible');
    });
    describe('sees the status column', () => {
      cy.get(':nth-child(1) > :nth-child(4) > .govuk-tag').should('be.visible').and('contain.text', 'Due');
      cy.get(':nth-child(2) > :nth-child(4) > .govuk-tag').should('be.visible').and('contain.text', 'Void');
      cy.get(':nth-child(3) > :nth-child(4) > .govuk-tag').should('be.visible').and('contain.text', 'Overdue');
    });

    //  Click Sign out Button
    cy.get('#signout').click();

    //  assert the signout
    cy.contains('You\'re signed out');
  });
});
