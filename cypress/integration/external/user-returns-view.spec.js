
const { setUp, tearDown } = require('../../support/setup');
const checkErrorMessage = (message) => {
  describe('it sees the correct error message', () => {
    cy.get('.govuk-list > li > a').should('have.text', message);
  });
};

describe('check for different return status as an external user', () => {
  beforeEach(() => {
    tearDown();
    setUp('barebones');
  });

  afterEach(() => {
    tearDown();
  });

  it('sees the page title', () => {
    cy.visit(Cypress.env('USER_URI'));

    // tap the sign in button on the welcome page
    cy.get('a[href*="/signin"]').click();
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.external);
    });
    cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));

    //  Click Sign in Button
    cy.get('.govuk-button.govuk-button--start').click();
    cy.contains('Your licences').should('have.class', 'govuk-heading-l');

    //  Search for the licence
    describe('sees the licences table', () => {
      cy.contains('AT/CURR/MONTHLY/02').should('be.visible');
      cy.get('#results').should('be.visible');
    });

    describe('sees the three licences created by the setup routine', () => {
      cy.get('#results').should('contain.text', 'AT/CURR/MONTHLY/02');
    });
    describe('clicks on the MONTHLY licence 02', () => {
      cy.contains('AT/CURR/MONTHLY/02').click();
      cy.get('.govuk-heading-l').should('be.visible').and('contain.text', 'Licence number AT/CURR/MONTHLY/02');
    });

    // Click on returns to see different status
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
      cy.get(':nth-child(2) > :nth-child(4) > .govuk-tag').should('be.visible').and('contain.text', 'Overdue');
    });
  });
});
