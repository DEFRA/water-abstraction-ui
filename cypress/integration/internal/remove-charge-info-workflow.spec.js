const { setUp, tearDown } = require('../../support/setup');
const firstRowSelector = '#toSetUp .govuk-table > tbody:nth-child(2) > tr:nth-child(1)';

describe('remove charge info workflow as B&D user', () => {
  before(() => {
    tearDown();
    setUp('charge-version-workflow');
  });

  after(() => {
    cy.get('#signout').click();
    tearDown();
  });

  it('navigates to charge info workflow page', () => {
    cy.visit(Cypress.env('ADMIN_URI'));
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
    });

    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('.govuk-button.govuk-button--start').click();
    cy.getCookie('session');
    cy.get('#navbar-notifications').click();
    cy.get('.govuk-heading-m').eq(5).should('have.text', 'View charge information workflow');
    // navigates to charge info workflow page
    cy.get('[href*="/charge-information-workflow"]').click();
    cy.get('.govuk-heading-xl').should('contain.text', 'Charge information workflow');

    describe('sees the workflow tabs', () => {
      cy.get('#tab_toSetUp').should('contain.text', 'To set up');
      cy.get('#tab_review').should('contain.text', 'Review');
      cy.get('#tab_changeRequest').should('contain.text', 'Change request');
    });

    describe('sees the expected workflow in the table', () => {
      cy.get(firstRowSelector).should('contain.text', 'AT/CURR/DAILY/01');
      cy.get(firstRowSelector).should('contain.text', 'Big Farm Co Ltd');
      cy.get(firstRowSelector).should('contain.text', '1 March 2020');
    });
    describe('sees the action links against the workflow and clicks the Remove link ', () => {
      cy.get(firstRowSelector).should('contain.text', 'Set up');
      cy.get(firstRowSelector).should('contain.text', 'Remove');
      cy.get('a[href*="/remove"]').click();
      cy.url().should('include', '/charge-information-workflow');
      cy.url().should('include', '/remove');
      cy.get('.govuk-heading-xl').should('contain.text', 'about to remove this licence from the workflow');
    });

    describe('sees the data on the confirmation page', () => {
      cy.get('.govuk-table__row').children(0).should('contain.text', 'AT/CURR/DAILY/01');
      cy.get('.govuk-table__row').children(1).should('contain.text', 'Big Farm Co Ltd');
      cy.get('.govuk-table__row').children(2).should('contain.text', '1 April 1920');
    });

    describe('clicks remove button and is redirected back to workflow page', () => {
      cy.get('button.govuk-button').click();
      cy.url().should('include', '/charge-information-workflow');
    });
  });

  it('removes workflow and sees that data has been removed', () => {
    cy.get('#toSetUp').eq(0).should('not.have.text', 'AT/CURR/DAILY/01');
  });
});
