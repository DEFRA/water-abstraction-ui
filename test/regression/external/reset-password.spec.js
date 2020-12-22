'use strict';

const { getButton, getPageTitle, getValidationSummaryMessage } = require('../shared/helpers/page');
const { getPersonalisation } = require('../shared/helpers/notifications');
const { setUp } = require('../shared/helpers/setup');
const config = require('./config');

const EMAIL_ADDRESS = 'acceptance-test.external@example.com';

/* eslint-disable no-undef */
describe('external user resetting their password:', function () {
  before(async () => {
    // registerUser(EMAIL_ADDRESS);
    await setUp();
    browser.url(`${config.baseUrl}/signin`);
  });

  it('navigate to the reset your password page', () => {
    $('#main-content > p > a').click();
    expect(browser).toHaveUrlContaining('/reset_password');
    expect(getPageTitle()).toHaveText('Reset your password');
  });

  it('shows the email address field', () => {
    expect($('label[for="email"]')).toHaveText('Email address');
    expect($('input#email')).toBeVisible();
  });

  it('shows a validation message if the email field is empty', () => {
    $('input#email').setValue('');
    getButton('Continue').click();

    expect(getValidationSummaryMessage()).toHaveText('Enter an email address');
  });

  it('shows a validation message if the email field is invalid', () => {
    $('input#email').setValue('not-an-email-address');
    getButton('Continue').click();

    expect(getValidationSummaryMessage()).toHaveText('Enter an email address in the correct format');
  });

  it('navigates to success page if the email address is valid', () => {
    $('input#email').setValue(EMAIL_ADDRESS);
    getButton('Continue').click();

    expect(browser).toHaveUrlContaining('/reset_password_check_email');
    expect(getPageTitle()).toHaveText('Check your email');
  });

  it('shows a link to resend the reset password email', () => {
    expect($('a[href="/reset_password_resend_email"]')).toHaveText('Has the email not arrived?');
  });

  it('clicks the link in the confirmation email', () => {
    const resetUrl = getPersonalisation(config.baseUrl, EMAIL_ADDRESS, 'reset_url');
    browser.url(resetUrl);
    expect(browser).toHaveUrlContaining('/reset_password_change_password?');
    expect(getPageTitle()).toHaveText('Change your password');
  });

  it('shows the change password fields', () => {
    expect($('label[for="password"]')).toHaveText('Enter a new password');
    expect($('input#password')).toBeVisible();
    expect($('label[for="confirm-password"]')).toHaveText('Confirm your password');
    expect($('input#confirm-password')).toBeVisible();
  });

  it('changes the password and signs in', () => {
    $('#password').setValue('P@55word');
    $('#confirm-password').setValue('P@55word');

    getButton('Change password').click();
  });

  it('is redirected to the add licences page', async () => {
    expect(browser).toHaveUrlContaining('/licences');
    expect(browser).toHaveUrlContaining('/add-licences');
    expect(getPageTitle()).toHaveText('Add your licences to the service');
  });
});
