const { setUp, tearDown } = require('../../support/setup');
const LICENCE_NUMBER = 'AT/CURR/MONTHLY/01';

describe('B&D user able to view charge information tab', () => {
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
      cy.contains('Licences, users and returns');
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

describe('Charge version workflow journey', () => {
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
      cy.contains('Licences, users and returns');
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

  it('navigates to the Charge information tab', () => {
    cy.get('#tab_charge').click();
    cy.get('#charge > .govuk-heading-l').should('have.text', 'Charge information');
  });
  
  it('click Set up new charge', () => {
    cy.get('.govuk-button').contains('Set up a new charge').click();
    // cy.url().should('contain', '/charge-information/create');
  });

  it('user selects reason for new charge information', () => {
    cy.get('.govuk-heading-l').contains('Select reason for new charge information');
    cy.get('.govuk-radios__input').contains('reason').click();
    cy.get('button.govuk-button').click();
    cy.get('.govuk-back-link').click();
  });

});