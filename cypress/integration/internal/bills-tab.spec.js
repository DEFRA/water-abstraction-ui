const { setUp, tearDown } = require('../../support/setup');
const LICENCE_NUMBER = 'AT/CURR/DAILY/01';

describe('non-charging user unable to view bills tab', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
  });

  after(() => {
    tearDown();
  });

  it('searches for licence by licence number and clicks on it', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.psc);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      // assert once the user is signed in
      cy.contains('Search');
      // search for a license
      cy.get('#query').type(LICENCE_NUMBER).should('be.visible');
      cy.get('.search__button').click();
      cy.contains('Licences').should('be.visible');
      // click on the licnce number
      cy.get('td').first().click();
      cy.url().should('contain', '/licences/');
      cy.contains(LICENCE_NUMBER).should('be.visible');
    });
  });
  it('sees the licence tabs and the bills tab is not shown', () => {
    cy.get('ul.govuk-tabs__list').children().should('have.lengthOf.at.least', 3);
    cy.get('#tab_summary').should('have.text', 'Summary');
    cy.get('#tab_returns').should('have.text', 'Returns');
    cy.get('#tab_communications').should('have.text', 'Communications');
    cy.get('ul.govuk-tabs__list').children().should('not.contain', 'Bills');
    cy.get('ul.govuk-tabs__list').children().should('not.contain', 'Charge Information');
  });
});

describe('B&D user able to view bills tab', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
  });

  after(() => {
    tearDown();
  });
  it('searches for licence by licence number and clicks on it', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      // assert once the user is signed in
      cy.contains('Search').should('be.visible');
      cy.contains('Enter a licence number, customer name, returns ID, registered email address or monitoring station').should('be.visible');
      // search for a license
      cy.get('#query').type(LICENCE_NUMBER).should('be.visible');
      cy.get('.search__button').click();
      cy.contains('Licences').should('be.visible');

      // click on the licence number
      cy.get('td').first().click();
      cy.url().should('contain', '/licences/');
      cy.contains(LICENCE_NUMBER).should('be.visible');
    });
  });
  it('sees the licence tabs Summary, returns, communications, bills and charge information', () => {
    cy.get('ul.govuk-tabs__list').children().should('have.lengthOf.at.least', 3);
    cy.get('#tab_summary').should('have.text', 'Summary');
    cy.get('#tab_returns').should('have.text', 'Returns');
    cy.get('#tab_communications').should('have.text', 'Communications');
    cy.get('ul.govuk-tabs__list').children().should('be.visible', 'Bills');
    cy.get('ul.govuk-tabs__list').children().should('be.visible', 'Charge Information');
  });

  it('navigates to the Bills tab', () => {
    cy.get('#tab_bills').click();
    cy.get('#bills > .govuk-heading-l').should('have.text', 'Bills');
  });
  it('sees the bills table displaying invoice data', () => {
    cy.get('#bills').should('be.visible');
    cy.get('table').contains('td', 'SAI10000100').should('be.visible');// Bill number
    cy.get('table').contains('td', 'A99999999A').should('be.visible'); // Billing account
    cy.get('table').contains('td', 'Annual').should('be.visible'); // Bill run type
    cy.get('table').contains('td', '2021').should('be.visible'); // Financial year
    cy.get('table').contains('td', '£1,245.67').should('be.visible'); // Bill total
  });
});
