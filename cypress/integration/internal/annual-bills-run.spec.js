const { setUp, tearDown } = require('../../support/setup');

describe('annual bill run', () => {
  beforeEach(() => {
    tearDown();
    setUp('annual-billing');
  });

  afterEach(() => {
    tearDown();
  });

  it('user logs in and generates annual bill', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      // assert once the user is signed in
      cy.contains('Licences, users and returns');
      // user clicks on manage link to set up the supplementary bill run
      describe('user clicks on Manage link', () => {
        cy.get('#navbar-notifications').click();
      });

      describe('user enters the create a new bill flow', () => {
        cy.get('.govuk-link').contains('Create a bill run').click();
      });

      describe('user selects annual billing type', () => {
        cy.get('#selectedBillingType').click();
        cy.get('button.govuk-button').click();
      });

      describe('user cancels the bill after generating it', () => {
        cy.get('.govuk-radios__item').last().children().first().click();
        cy.get('button.govuk-button').click();
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Annual bill run');
        cy.url().should('contain', '/summary');
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(1).contains('Cancel bill run').click();
        cy.get('button.govuk-button').click();
        cy.get('a.govuk-button').eq(2).click();

      });

      describe('user generates the annual bill ', () => {
        cy.get('#selectedBillingType').click();
        cy.get('button.govuk-button').click();
        cy.get('.govuk-radios__item').last().children().first().click();
        cy.get('button.govuk-button').click();
        cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Annual bill run');
        cy.url().should('contain', '/summary');
        cy.get('#tab_other-abstractors').click();
        cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
        cy.get('.govuk-heading-l').should('contain', 'You are about to send this bill run');
        cy.get('button.govuk-button').click();
        cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Bill run sent');
        cy.get('div.govuk-grid-column-two-thirds').eq(1).children(3).contains('Go to bill run').click();
        cy.get('.govuk-heading-xl').contains('Annual bill run');
      });
    });
  });

  it('user verifies the data in other abstractors', () => {
    cy.visit(Cypress.env('ADMIN_URI'));
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      cy.get('#navbar-notifications').click();
      cy.get('.govuk-link').contains('Create a bill run').click();
      cy.get('#selectedBillingType').click();
      cy.get('button.govuk-button').click();
      cy.get('.govuk-radios__item').last().children().first().click();
      cy.get('button.govuk-button').click();
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Annual bill run');
      cy.get('#tab_other-abstractors').click();
      // verify the data
      cy.get('.govuk-table__row').eq(1).should('contain', 'A99999999A');
      cy.get('.govuk-table__row').eq(1).should('contain', 'Big Farm Co Ltd');
      cy.get('td.govuk-table__cell').last().children(0).click({ force: true });
      describe('user verifys the generated bill', () => {
        cy.get('.govuk-caption-l').should('contain', 'Billing account A99999999A');
        cy.get('.govuk-grid-column-full > :nth-child(4)').click();
      });
    });
  });
});
