'use strict';
const { getButton, getPageTitle, getPageCaption, getValidationSummaryMessage } = require('../shared/helpers/page');
const { getPersonalisation } = require('../shared/helpers/notifications');
const { baseUrl } = require('./config');

const EMAIL_ADDRESS = 'acceptance-test.internal.wirs@defra.gov.uk';

/* eslint-disable no-undef */
describe('internal user resetting their password:', function () {
  before(async () => {
    browser.url(`${baseUrl}/signin`);
  });

  it('navigate to the reset your password page', () => {
    $('a[href="/reset_password"]').click();
    expect(browser).toHaveUrlContaining('/reset_password');
    expect(getPageTitle()).toHaveText('Reset your password');
  });

  it('shows the email address field', () => {
    expect($('label[for="email"]')).toHaveText('Email address');
    expect($('input#email')).toBeVisible();
  });

  it('shows a validation message if the email field is empty', async () => {
    const email = await $('#email');
    const continueButton = await getButton('Continue');
    const validationMessage = await getValidationSummaryMessage();

    email.setValue('');
    continueButton.click();
    expect(validationMessage).toHaveText('Enter an email address in the right format');
  });

  it('shows a validation message if the email field is invalid', async () => {
    const email = await $('#email');
    const continueButton = await getButton('Continue');
    const validationMessage = await getValidationSummaryMessage();

    email.setValue('not-an-email-address');
    continueButton.click();
    expect(validationMessage).toHaveText('Enter an email address in the right format');
  });

  it('navigates to success page if the email address is valid', async () => {
    const email = await $('input#email');
    const continueButton = await getButton('Continue');
    const pageTitle = await getPageTitle();

    email.setValue(EMAIL_ADDRESS);
    continueButton.click();

    expect(browser).toHaveUrlContaining('/reset_password_check_email');
    expect(pageTitle).toHaveText('Check your email');
  });

  it('shows a link to resend the reset password email', async () => {
    const resetPasswordLink = await $('a[href="/reset_password_resend_email"]');
    expect(resetPasswordLink).toHaveText('Has the email not arrived?');
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

  it('is redirected to the search page', async () => {
    expect(browser).toHaveUrlContaining('/licences');
    expect(getPageTitle()).toHaveText('Licences, users and returns');
    expect(getPageCaption()).toHaveText('Search');
  });
});
