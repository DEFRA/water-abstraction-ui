const { setUp, tearDown } = require('../../support/setup');

describe('Licence agreement - Set up, View, End and Delete', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('user logs in and sets up new License Agreement, Ends it and deletes the agreement', () => {
    cy.visit(Cypress.env('ADMIN_URI'));
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
    });
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('.govuk-button.govuk-button--start').click();
    // assert the user is signed in
    cy.contains('Licences, users and returns');
    cy.get('#query').clear();
    cy.get('#query').type('AT/CURR/MONTHLY/02').should('be.visible');
    cy.get('.search__button').click();
    cy.contains('Licences').should('be.visible');
    cy.get('.govuk-table__row').contains('AT/CURR/MONTHLY/02').click();

    describe('sets up the sets up new License Agreemen', () => {
      // setting up the new agreement
      cy.get('#tab_charge').click();
      cy.get('#charge').contains('Set up a new agreement').click();
      cy.get('#financialAgreementCode-3').check();
      cy.get('form > .govuk-button').click();
      cy.get('#isDateSignedKnown-2').check();
      cy.get('form > .govuk-button').click();
      cy.get('#isCustomStartDate-2').click();
      cy.get('form > .govuk-button').click();
    // Agreement details entered and ready to submit
    });

    describe('Asserting the agreement details before submitting the form', () => {
      cy.get('.govuk-heading-l').contains('Check agreement details').should('be.visible');
      cy.get('.govuk-summary-list__value').contains('Canal and Rivers Trust, unsupported source (S130U)').should('be.visible');
      cy.get('form > .govuk-button').click();
    });

    describe('Viewing, asserting the agreement details after submitting the form', () => {
      cy.get('#tab_summary').should('be.visible');
      cy.get('.govuk-table')
        .children()
        .should('contain', 'End date')
        .should('contain', 'Agreement')
        .should('contain', 'Date signed')
        .should('contain', 'Action')
        .should('contain', 'Canal and Rivers Trust, unsupported source (S130U)')
        .should('contain', 'Delete')
        .should('contain', 'End');
    });

    describe('End the created agreement using invalid date', () => {
      cy.get('a.govuk-link').eq(5).contains('End').click({ force: true });
      cy.get('.govuk-heading-l').contains('Set agreement end date');
      cy.get('#endDate-day').type('01');
      cy.get('#endDate-month').type('01');
      cy.get('#endDate-year').type('2021');
      cy.get('form > .govuk-button').click();
      // error message
      cy.get('.govuk-error-summary').contains('Enter an end date on or after the agreement start date (01-04-2021)').should('be.visible');
    });

    describe('End the created agreement using valid date', () => {
      cy.get('#endDate-day').clear().type('01');
      cy.get('#endDate-month').clear().type('05');
      cy.get('#endDate-year').clear().type('2021');
      cy.get('form > .govuk-button').click();
      cy.get('.govuk-table')
        .children()
        .should('contain', 'End date')
        .should('contain', '1 May 2021');
      // Click end the agreement button
      cy.get('form > .govuk-button').click();
      // assert the agreement end date
      cy.get('.govuk-table')
        .children()
        .should('contain', 'End date').should('be.visible')
        .should('contain', '1 May 2021').should('be.visible');
    });
    describe('Delete the  agreement', () => {
      cy.get('a.govuk-link').eq(4).contains('Delete').click({ force: true });
      cy.get('.govuk-heading-l').contains("You're about to delete this agreement");
      cy.get('form > .govuk-button').contains('Delete agreement').click();
      cy.get('#charge').contains('Set up a new agreement').should('be.visible');
    });

    // user signing out
    describe('user signing out', () => {
      cy.get('#signout').click();
      cy.contains('You\'re signed out').should('be.visible');
    });
  });
});
