'use strict';

const { getButton, getPageTitle, getValidationSummaryMessage } = require('../shared/helpers/page');
const { getPersonalisation } = require('../shared/helpers/notifications');
const { baseUrl } = require('./config');

const EMAIL_ADDRESS = 'acceptance-test.external@example.com';

/* eslint-disable no-undef */
describe('external user resetting their password:', function () {
  before(async () => {
    await browser.url(`${baseUrl}/signin`);
  });

  it('navigate to the reset your password page', async () => {
    const passwordResetLink = await $('#main-content > p > a');
    passwordResetLink.click();
    expect(browser).toHaveUrlContaining('/reset_password');
    expect(getPageTitle()).toHaveText('Reset your password');
  });

  it('shows the email address field', async () => {
    const emailFieldLabel = await $('label[for="email"]');
    const emailFieldInput = await $('input#email');
    expect(emailFieldLabel).toHaveText('Email address');
    expect(emailFieldInput).toBeVisible();
  });

  it('shows a validation message if the email field is empty', async () => {
    const email = await $('#email');
    const continueButton = await getButton('Continue');

    email.setValue('');
    await continueButton.click();
    browser.pause(1000);

    const validationMessage = await getValidationSummaryMessage();
    expect(validationMessage).toHaveText('Enter an email address');
  });

  it('shows a validation message if the email field is invalid', async () => {
    const email = await $('input#email');
    const continueButton = await getButton('Continue');

    email.setValue('not-an-email-address');
    await continueButton.click();
    browser.pause(1000);

    const validationMessage = await getValidationSummaryMessage();
    expect(validationMessage).toHaveText('Enter an email address in the right format');
  });

  it('navigates to success page if the email address is valid', async () => {
    const emailFieldInput = await $('input#email');
    const continueButton = await getButton('Continue');
    const pageTitle = await getPageTitle();

    emailFieldInput.setValue(EMAIL_ADDRESS);
    continueButton.click();

    expect(browser).toHaveUrlContaining('/reset_password_check_email');
    expect(pageTitle).toHaveText('Check your email');
  });

  it('shows a link to resend the reset password email', async () => {
    const linkToResendEmail = await $('a[href="/reset_password_resend_email"]');
    expect(linkToResendEmail).toHaveText('Has the email not arrived?');
  });

  it('clicks the link in the confirmation email', async () => {
    const resetUrl = await getPersonalisation(baseUrl, EMAIL_ADDRESS, 'reset_url');
    const pageTitle = await getPageTitle();

    browser.url(resetUrl);
    expect(browser).toHaveUrlContaining('/reset_password_change_password?');
    expect(pageTitle).toHaveText('Change your password');
  });

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

    passwordFieldInput.setValue('P@55word');
    confirmPasswordFieldInput.setValue('P@55word');

    changePasswordButton.click();
  });

  it('is redirected to the add licences page', async () => {
    expect(browser).toHaveUrlContaining('/licences');
    expect(browser).toHaveUrlContaining('/add-licences');
    expect(getPageTitle()).toHaveText('Add your licences to the service');
  });
});
