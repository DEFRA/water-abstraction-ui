const { setUp, tearDown } = require('../../support/setup');
const { createSrocChargeVersion } = require('../../support/sroc-charge-version');
const LICENCE_NUMBER = 'AT/CURR/DAILY/01';

describe('Create SRoC Charge version workflow journey', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
  });

  after(() => {
    tearDown();
  });

  it('Create SRoC Charge version workflow journey', () => {
    cy.visit(Cypress.env('ADMIN_URI'));

    describe('User login', () => {
      // Enter the user name and Password
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.billingAndData);
        cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
        cy.get('.govuk-button.govuk-button--start').click();
        // assert once the user is signed in
        cy.contains('Search').should('be.visible');
        cy.contains('Enter a licence number, customer name, returns ID, registered email address or monitoring station').should('be.visible');
      });
    });
    describe('create sroc charge version', () => {
      createSrocChargeVersion(LICENCE_NUMBER);
    });
  });
});
