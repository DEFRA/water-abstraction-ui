const { setUp, tearDown } = require('../../support/setup');

describe('Reset password', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  /* eslint-disable no-undef */
  it('Navigate to the signin page', () => {
    cy.visit(Cypress.env('USER_URI'));
    cy.get('a[href*="/signin"]').click();
  });

  it('Navigate to the reset your password page', () => {
    cy.get('a[href*="/reset_password').click();
    cy.contains('Reset your password').should('have.class', 'govuk-heading-l');
    cy.contains('Email address').should('have.class', 'govuk-label');
  });

  it('shows a validation message if the email field is empty', () => {
    cy.get('button.govuk-button.govuk-button--start').click();
    cy.contains('Enter an email address').should('have.attr', 'href', '#email');
  });

  it('shows a validation message if the email field is invalid', () => {
    cy.get('input#email').type('invalid....email');
    cy.get('button.govuk-button.govuk-button--start').click();
    cy.contains('Enter an email address in the correct format').should('have.attr', 'href', '#email');
    cy.get('input#email').clear();
  });

  it('navigates to success page if the email address is valid', () => {
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.external);
    });
    cy.get('button.govuk-button.govuk-button--start').click();
    cy.contains('Check your email').should('have.class', 'govuk-heading-l');
    cy.contains('Has the email not arrived?').should('have.attr', 'href', '/reset_password_resend_email');
  });

  it('clicks the link in the confirmation email', () => {
    cy.fixture('users.json').then(users => {
      cy.getPasswordResetUrl(Cypress.env('USER_URI'), users.external).then(response => {
        cy.visit(response);
      });
    });
  });

  it('check the title and shows the change password fields', () => {
    cy.contains('Change your password').should('be.visible');
    cy.contains('Enter a new password').should('be.visible');
    cy.contains('Confirm your password').should('be.visible');
  });

  it('changes the password and signs in', () => {
    cy.get('[id=password]').type('P@55word');
    cy.get('[id=confirm-password]').type('P@55word');
    cy.get('button.govuk-button').click();
  });

  it('is redirected to the your licences page', () => {
    cy.contains('View licences').should('have.attr', 'href', '/licences');
    cy.contains('Manage returns').should('have.attr', 'href', '/returns');
    cy.contains('Add licences or give access').should('have.attr', 'href', '/manage_licences');
    cy.contains('Your licences').should('have.class', 'govuk-heading-l');
  });
});
