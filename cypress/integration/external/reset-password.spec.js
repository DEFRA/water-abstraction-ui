import '../../support/notifications';
const { getPersonalisation } = require('../../support/notifications');
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
      const email = getPersonalisation(Cypress.env('USER_URI'), users.external, 'reset_url');
      cy.log(email);

      const lastNotification = email ? email.body ? email.body.data[0] : {} : {};

      const personalisation = lastNotification ? lastNotification.personalisation ? lastNotification.personalisation['reset_url'] : null : null;
      cy.visit(personalisation);
    });

    // const resetUrl = await getPersonalisation(baseUrl, EMAIL_ADDRESS, 'reset_url');
    // const pageTitle = await getPageTitle();

    // browser.url(resetUrl);
    // expect(browser).toHaveUrlContaining('/reset_password_change_password?');
    // expect(pageTitle).toHaveText('Change your password');
  });

  /*
  it('shows the change password fields', async () => {
    const passwordFieldLabel = await $('label[for="password"]');
    const passwordFieldInput = await $('input#password');
    const confirmPasswordFieldLabel = await $('label[for="confirm-password"]');
    const confirmPasswordFieldInput = await $('input#confirm-password');

    expect(passwordFieldLabel).toHaveText('Enter a new password');
    expect(passwordFieldInput).toBeVisible();
    expect(confirmPasswordFieldLabel).toHaveText('Confirm your password');
    expect(confirmPasswordFieldInput).toBeVisible();
  });

  it('changes the password and signs in', async () => {
    const passwordFieldInput = await $('input#password');
    const confirmPasswordFieldInput = await $('input#confirm-password');
    const changePasswordButton = await getButton('Change password');

    await passwordFieldInput.setValue('P@55word');
    await confirmPasswordFieldInput.setValue('P@55word');

    await changePasswordButton.click();
  });

  it('is redirected to the add licences page', async () => {
    expect(browser).toHaveUrlContaining('/licences');
    expect(browser).toHaveUrlContaining('/add-licences');
    expect(getPageTitle()).toHaveText('Add your licences to the service');
  }); */
});
