const { setUp, tearDown } = require('../../support/setup');

describe('User registration', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('redirects to the welcome page', () => {
    cy.visit(Cypress.env('USER_URI'));
    cy.contains('Sign in or create an account').should('have.class', 'govuk-heading-l');
  });

  it('navigates to the start page', () => {
    cy.get('.govuk-button').eq(2).click();
    cy.contains('Create an account to manage your water abstraction licence online').should('have.class', 'govuk-heading-l');
  });

  it('navigates to the create account page', () => {
    cy.contains('Create account').should('be.visible');
    cy.get('.govuk-button--start').click({ force: true });
    cy.contains('Create an account').should('have.class', 'govuk-heading-l');
  });

  it('shows a validation message if the email field is empty', () => {
    cy.get('input#email').type(' ');
    cy.get('button.govuk-button').click();
    cy.contains('Enter an email address in the right format').should('have.attr', 'href', '#email');
  });

  it('shows a validation message if the email field is invalid', () => {
    cy.get('input#email').type('not a valid email ');
    cy.get('button.govuk-button').click();
    cy.contains('Enter an email address in the right format').should('have.attr', 'href', '#email');
  });

  it('navigates to the success page if the email address is valid', () => {
    cy.get('input#email').clear();
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.externalNew);
    });
    cy.get('button.govuk-button').click();
    cy.contains('Confirm your email address').should('have.class', 'govuk-heading-l');
  });

  it('clicks the link in the confirmation email', () => {
    cy.fixture('users.json').then(users => {
      cy.getUserRegistrationUrl(Cypress.env('USER_URI'), users.externalNew).then(response => {
        cy.visit(response);
      });
    });
  });

  it('shows a validation error message if no passwords are entered', () => {
    cy.get('input#password').type(' ');
    cy.get('input#confirm-password').type(' ');
    cy.get('form').submit();
    cy.contains('There is a problem').should('have.class', 'govuk-error-summary__title');
  });

  it('shows a validation error message if passwords are too short', () => {
    cy.get('input#password').type('short');
    cy.get('input#confirm-password').type('short');
    cy.get('form').submit();
    cy.contains('There is a problem').should('have.class', 'govuk-error-summary__title');
    // verifying that error and warnings are displayed
    cy.get('.govuk-list.govuk-error-summary__list').children().should('have.length', 6);
  });

  it('shows a validation error message if passwords have correct length only', () => {
    cy.get('input#password').type('12345678');
    cy.get('input#confirm-password').type('12345678');
    cy.get('form').submit();
    cy.contains('Your password contains').should('have.class', 'govuk-visually-hidden');
  });

  it('shows a validation error message if passwords have symbol only', () => {
    cy.get('input#password').type('123$');
    cy.get('input#confirm-password').type('123$');
    cy.get('form').submit();
    cy.contains('Your password contains').should('have.class', 'govuk-visually-hidden');
  });

  it('shows a validation error message if passwords have capital only', () => {
    cy.get('input#password').type('123A');
    cy.get('input#confirm-password').type('123A');
    cy.get('form').submit();
    cy.contains('Your password contains').should('have.class', 'govuk-visually-hidden');
  });

  it('shows a validation error message if passwords do not match', () => {
    cy.get('input#password').type('A12345678$');
    cy.get('input#confirm-password').type('A123456789$');
    cy.get('form').submit();
    cy.contains('Re-enter your new password').should('have.attr', 'href', '#password');
  });

  it('sets the passwords and signs in if valid and matching', () => {
    cy.get('input#password').type('A12345678$');
    cy.get('input#confirm-password').type('A12345678$');
    cy.get('form').submit();
    cy.url().should('include', '/add-licences');
    cy.contains('Add your licences to the service').should('have.class', 'govuk-heading-l');
  });
  it('User logout', () => {
    //  Click Sign out Button
    cy.get('#signout').click();
    //  assert the signout
    cy.contains('Sign in or create an account').should('be.visible');
  });
});