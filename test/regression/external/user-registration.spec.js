'use strict';

const { getButton, getPageTitle, getValidationSummaryMessage, getByTestId } = require('../shared/helpers/page');
const { getPersonalisation } = require('./helpers/notifications');
const config = require('./config');

const uuid = require('uuid/v4');
const qs = require('querystring');

const EMAIL_ADDRESS = `${uuid()}@example.com`;

/* eslint-disable no-undef */
describe('external user registration', () => {
  const expectPasswordValidationToBe = (length, symbol, capital) => {
    const messages = [
      '8 characters',
      '1 symbol (like ?!£%)',
      '1 capital letter'
    ];
    const flags = [
      length,
      symbol,
      capital
    ];
    messages.forEach((message, i) => {
      expect(getValidationSummaryMessage(i)).toHaveTextContaining(message);
      expect(getValidationSummaryMessage(i)).toHaveTextContaining(flags[i] ? '✓' : '✗');
    });
  };

  before(() => {
    browser.url(config.baseUrl);
  });

  it('redirects to the welcome page', () => {
    expect(browser).toHaveUrlContaining('/welcome');
    expect(getPageTitle()).toHaveText('Sign in or create an account');
  });

  it('navigates to the start page', () => {
    getButton('Create account').click();
    expect(browser).toHaveUrlContaining('/start');
    expect(getPageTitle()).toHaveText('Create an account to manage your water abstraction licence online');
  });

  it('navigates to the create account page', () => {
    getButton('Create account').click();
    expect(browser).toHaveUrlContaining('/register');
    expect(getPageTitle()).toHaveText('Create an account');
  });

  it('shows a validation message if the email field is empty', () => {
    $('#email').setValue('');
    getButton('Continue').click();
    expect(getValidationSummaryMessage()).toHaveText('Enter an email address in the right format');
  });

  it('shows a validation message if the email field is invalid', () => {
    $('#email').setValue('not-an-email-address');
    getButton('Continue').click();
    expect(getValidationSummaryMessage()).toHaveText('Enter an email address in the right format');
  });

  it('navigates to the success page if the email address is valid', () => {
    $('#email').setValue(EMAIL_ADDRESS);
    getButton('Continue').click();
    const uri = `/success?${qs.encode({ email: EMAIL_ADDRESS })}`;
    expect(browser).toHaveUrlContaining(uri);
    expect(getPageTitle()).toHaveText('Confirm your email address');
  });

  it('shows confirmation text including the email address', () => {
    expect(getByTestId('success-text')).toHaveText(`We have sent a link to ${EMAIL_ADDRESS}`);
  });

  it('clicks the link in the confirmation email', () => {
    const link = getPersonalisation(EMAIL_ADDRESS, 'link');
    browser.url(link);
    expect(browser).toHaveUrlContaining('/create-password?');
    expect(getPageTitle()).toHaveText('Create a password');
  });

  it('shows a validation error message if no passwords are entered', () => {
    $('#password').setValue('');
    $('#confirm-password').setValue('');
    getButton('Change password').click();
    expectPasswordValidationToBe(false, false, false);
  });

  it('shows a validation error message if passwords are too short', () => {
    $('#password').setValue('short');
    $('#confirm-password').setValue('short');
    getButton('Change password').click();
    expectPasswordValidationToBe(false, false, false);
  });

  it('shows a validation error message if passwords have correct length only', () => {
    $('#password').setValue('12345678');
    $('#confirm-password').setValue('12345678');
    getButton('Change password').click();
    expectPasswordValidationToBe(true, false, false);
  });

  it('shows a validation error message if passwords have symbol only', () => {
    $('#password').setValue('123$');
    $('#confirm-password').setValue('123$');
    getButton('Change password').click();
    expectPasswordValidationToBe(false, true, false);
  });

  it('shows a validation error message if passwords have capital only', () => {
    $('#password').setValue('123A');
    $('#confirm-password').setValue('123A');
    getButton('Change password').click();
    expectPasswordValidationToBe(false, false, true);
  });

  it('shows a validation error message if passwords do not match', () => {
    $('#password').setValue('A12345678$');
    $('#confirm-password').setValue('B12345678$');
    getButton('Change password').click();
    expect(getValidationSummaryMessage()).toHaveText('Re-enter your new password');
  });

  it('sets the passwords and signs in if valid and matching', () => {
    $('#password').setValue('A12345678$');
    $('#confirm-password').setValue('A12345678$');
    getButton('Change password').click();
    expect(browser).toHaveUrlContaining('/add-licences');
    expect(getPageTitle()).toHaveText('Add your licences to the service');
  });

  /**
   * @todo flow where user enters email twice
   * @todo flow where user is already registered
   */
});
