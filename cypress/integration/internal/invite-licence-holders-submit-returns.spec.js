const { setUp, tearDown } = require('../../support/setup');

describe('Inviting users to submit the returns', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('Inviting users to submit the returns', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      // assert once the user is signed in
    });

    describe('click on Invitations link to send the returns invitations', () => {
      cy.get('#navbar-notifications').click();
      cy.get('.govuk-link').eq(8).should('contain', 'Invitations').click();
      cy.url().should('contain', '/returns-notifications/invitations');
    });

    describe('continue send returns invitations without excluding any licences', () => {
      cy.get('.govuk-heading-l').should('contain', 'Send returns invitations');
      cy.get('.govuk-form-group').should('be.visible');
      cy.get('.govuk-label').should('contain', 'Enter the licence numbers which you want to exclude from this mailing list');
      cy.get('form > .govuk-button').should('contain', 'Continue').click();
    });

    describe('continue send returns invitations', () => {
      cy.url({ timeout: 20000 }).should('contain', '/batch-notification');
      cy.get('.govuk-heading-l').should('contain', 'Send returns invitations');
      cy.get('#main-content').should('contain', 'Mailing list is ready to send');
      cy.get('form > .govuk-button').click();
    });
    describe('send the invitations and assert the status', () => {
      cy.url().should('contain', '/batch-notifications/confirmation/');
      cy.get('.govuk-panel').should('be.visible');
      cy.get('.govuk-panel__title').should('contain', 'Return invitations sent');
      cy.get('.govuk-panel__body').should('contain', 'Your reference number');
    });
    describe('view report of the invitations sent', () => {
      cy.get('p > a').contains('View report').should('be.visible').click();
      cy.get('.govuk-caption-xl').contains('Notification report').should('be.visible');
      cy.get('.govuk-template__body')
        .children()
        .should('contain', 'Notification report')
        .should('contain', 'Returns: invitation')
        .should('contain', 'Sent to')
        .should('contain', 'Licence number')
        .should('contain', 'Method')
        .should('contain', 'Status');
    });
  });
});