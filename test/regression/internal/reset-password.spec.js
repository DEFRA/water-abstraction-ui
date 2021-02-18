'use strict';
const { getButton, getPageTitle, getPageCaption, getValidationSummaryMessage } = require('../shared/helpers/page');
const { getPersonalisation } = require('../shared/helpers/notifications');
const { baseUrl } = require('./config');
const { setUp } = require('../shared/helpers/setup');
const EMAIL_ADDRESS = 'acceptance-test.internal.wirs@defra.gov.uk';

/* eslint-disable no-undef */
describe('internal user resetting their password:', function () {
  before(async () => {
    await setUp('barebones');
    await browser.url(`${baseUrl}/signin`);
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

    await email.setValue('');
    await continueButton.click();
    await browser.pause(1000);

    const validationMessage = await getValidationSummaryMessage();
    expect(validationMessage).toHaveText('Enter an email address');
  });

  it('shows a validation message if the email field is invalid', async () => {
    const email = await $('#email');
    const continueButton = await getButton('Continue');

    await email.setValue('not-an-email-address');
    await continueButton.click();
    await browser.pause(1000);

    const validationMessage = await getValidationSummaryMessage();
    expect(validationMessage).toHaveText('Enter an email address in the right format');
  });

  it('navigates to success page if the email address is valid', async () => {
    const email = await $('input#email');
    const continueButton = await getButton('Continue');
    const pageTitle = await getPageTitle();

    await email.setValue(EMAIL_ADDRESS);
    await continueButton.click();

    expect(browser).toHaveUrlContaining('/reset_password_check_email');
    expect(pageTitle).toHaveText('Check your email');
  });

  it('shows a link to resend the reset password email', async () => {
    const resetPasswordLink = await $('a[href="/reset_password_resend_email"]');
    expect(resetPasswordLink).toHaveText('Has the email not arrived?');
  });

  it('clicks the link in the confirmation email', async () => {
    console.log('GOT HERE====');
    const resetUrl = await getPersonalisation(baseUrl, EMAIL_ADDRESS, 'reset_url');

    console.log('===---===---===');
    console.log(resetUrl);
    console.log(resetUrl);
    console.log(resetUrl);

    const pageTitle = await getPageTitle();
    await browser.url(resetUrl);
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

    await passwordFieldInput.setValue('P@55word');
    await confirmPasswordFieldInput.setValue('P@55word');

    await changePasswordButton.click();
  });

  it('is redirected to the search page', async () => {
    expect(browser).toHaveUrlContaining('/licences');
    expect(getPageTitle()).toHaveText('Licences, users and returns');
    expect(getPageCaption()).toHaveText('Search');
  });
});
