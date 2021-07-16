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
    cy.visit(Cypress.env('ADMIN_URI'));
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
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
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Due');
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Void');
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Overdue');
    });

    describe('change status from over due to received and asert', () => {
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Overdue');
      cy.get('[scope="row"] > a').contains(9999990).click();

      // record receipt and click continue
      cy.get('#action-2').check();
      cy.get('form > .govuk-button').click();

      // click submit button to record the returns received
      cy.get('form > .govuk-button').click();
      cy.get('.panel').contains('Return received Licence number AT/CURR/MONTHLY/02').should('be.visible');
    });

    describe('check the updated returns status', () => {
      cy.get('#navbar-view').contains('Licences').click();
      cy.get('#query').type('AT/CURR/MONTHLY/02').should('be.visible');
      cy.get('.search__button').click();
      cy.contains('Licences').should('be.visible');
      cy.get('.govuk-table__row').contains('AT/CURR/MONTHLY/02').click();
      cy.get('#tab_returns').click();

      // assert all the status of the returns
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Due');
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Void');
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Overdue');
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Complete');
      cy.get('.govuk-tag').should('be.visible').and('contain.text', 'Received');
    });

    // user signing out
    describe('user signing out', () => {
      cy.get('#signout').click();
      cy.contains('You\'re signed out');
    });
  });
});
