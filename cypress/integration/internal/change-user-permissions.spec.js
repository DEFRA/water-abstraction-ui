const { setUp, tearDown } = require('../../support/setup');

describe('change internal user permissions as B&D user', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('searches for user by email address', () => {
    cy.visit(Cypress.env('ADMIN_URI'));
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
      const EMAIL_ADDRESS = users.environmentOfficer;
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      cy.get('#query').type(EMAIL_ADDRESS);
      cy.get('.search__button').click();
      // cy.get('h2.govuk-heading-m').should('have.text', 'Users');
      cy.get('.govuk-grid-column-full > .govuk-heading-m').should('have.text', 'Users');
      cy.get('.govuk-list > li').should('contain.text', EMAIL_ADDRESS);
      cy.get('.govuk-list .govuk-link').click();
    });
  });

  it('navigates to the user page', () => {
    cy.url().should('include', '/status');
    cy.contains('Internal').should('be.visible');
    cy.get('.govuk-heading-l').eq(1).should('have.text', 'Set permissions');
    // cy.get('.govuk-grid-column-two-thirds > .govuk-heading-l').should('have.text', EMAIL_ADDRESS);
    describe('changes the user permissions and navigates to the success page', () => {
      cy.get('#permission-5').check();
      cy.get('form > .govuk-button').click();
      cy.url().should('include', '/update-permissions/success');
      // cy.getPageTitle().should('have.text', 'Account permissions are updated');
    });
    describe('user page shows updated permissions', () => {
      // cy.getBackLink().click();
      cy.get('.govuk-radios__input[checked=""] + label').should('have.text', 'National Permitting Service');
    });
  });
});
