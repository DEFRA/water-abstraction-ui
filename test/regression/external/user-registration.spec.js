'use strict';

const { getButton, getPageTitle, getValidationSummaryMessage, getByTestId } = require('../shared/helpers/page');
const { getPersonalisation } = require('../shared/helpers/notifications');
const { baseUrl } = require('./config');

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
    browser.url(baseUrl);
  });

  it('redirects to the welcome page', () => {
    expect(browser).toHaveUrlContaining('/welcome');
    expect(getPageTitle()).toHaveText('Sign in or create an account');
  });

  it('navigates to the start page', async () => {
    const createAccountButton = await getButton('Create account');
    await createAccountButton.click();
    expect(browser).toHaveUrlContaining('/start');
    expect(getPageTitle()).toHaveText('Create an account to manage your water abstraction licence online');
  });

  it('navigates to the create account page', async () => {
    const createAccountButton = await getButton('Create account');
    await createAccountButton.click();
    expect(browser).toHaveUrlContaining('/register');
    expect(getPageTitle()).toHaveText('Create an account');
  });

  it('shows a validation message if the email field is empty', async () => {
    const email = await $('#email');
    const continueButton = await getButton('Continue');
    const validationMessage = await getValidationSummaryMessage();

    await email.setValue('');
    await continueButton.click();
    expect(validationMessage).toHaveText('Enter an email address in the right format');
  });

  it('shows a validation message if the email field is invalid', async () => {
    const email = await $('input#email');
    const continueButton = await getButton('Continue');

    await email.setValue('not-an-email-address');
    await continueButton.click();
    browser.pause(1000);

    const validationMessage = await getValidationSummaryMessage();
    expect(validationMessage).toHaveText('Enter an email address in the right format');
  });

  it('navigates to the success page if the email address is valid', async () => {
    const email = await $('input#email');
    const continueButton = await getButton('Continue');
    const pageTitle = await getPageTitle();

    await email.setValue(EMAIL_ADDRESS);
    await continueButton.click();

    const uri = `/success?${qs.encode({ email: EMAIL_ADDRESS })}`;
    expect(browser).toHaveUrlContaining(uri);
    expect(pageTitle).toHaveText('Confirm your email address');
  });

  it('shows confirmation text including the email address', async () => {
    const confirmationText = await getByTestId('success-text');
    expect(confirmationText).toHaveText(`We have sent a link to ${EMAIL_ADDRESS}`);
  });

  it('clicks the link in the confirmation email', async () => {
    const link = await getPersonalisation(baseUrl, EMAIL_ADDRESS, 'link');
    const pageTitle = await getPageTitle();

    await browser.url(link);
    expect(browser).toHaveUrlContaining('/create-password?');
    expect(pageTitle).toHaveText('Create a password');
  });

  it('shows a validation error message if no passwords are entered', async () => {
    const passwordField = await $('#password');
    const confirmPasswordField = await $('#confirm-password');
    const changePasswordButton = await getButton('Change password');

    await passwordField.setValue('');
    await confirmPasswordField.setValue('');

    await changePasswordButton.click();
    expectPasswordValidationToBe(false, false, false);
  });

  it('shows a validation error message if passwords are too short', async () => {
    const passwordField = await $('#password');
    const confirmPasswordField = await $('#confirm-password');
    const changePasswordButton = await getButton('Change password');

    await passwordField.setValue('short');
    await confirmPasswordField.setValue('short');
    await changePasswordButton.click();

    expectPasswordValidationToBe(false, false, false);
  });

  it('shows a validation error message if passwords have correct length only', async () => {
    const passwordField = await $('#password');
    const confirmPasswordField = await $('#confirm-password');
    const changePasswordButton = await getButton('Change password');

    await passwordField.setValue('12345678');
    await confirmPasswordField.setValue('12345678');
    await changePasswordButton.click();
    expectPasswordValidationToBe(true, false, false);
  });

  it('shows a validation error message if passwords have symbol only', async () => {
    const passwordField = await $('#password');
    const confirmPasswordField = await $('#confirm-password');
    const changePasswordButton = await getButton('Change password');

    await passwordField.setValue('123$');
    await confirmPasswordField.setValue('123$');
    await changePasswordButton.click();

    expectPasswordValidationToBe(false, true, false);
  });

  it('shows a validation error message if passwords have capital only', async () => {
    const passwordField = await $('#password');
    const confirmPasswordField = await $('#confirm-password');
    const changePasswordButton = await getButton('Change password');

    await passwordField.setValue('123A');
    await confirmPasswordField.setValue('123A');
    await changePasswordButton.click();

    expectPasswordValidationToBe(false, false, true);
  });

  it('shows a validation error message if passwords do not match', async () => {
    const passwordField = await $('#password');
    const confirmPasswordField = await $('#confirm-password');
    const changePasswordButton = await getButton('Change password');

    await passwordField.setValue('A12345678$');
    await confirmPasswordField.setValue('B12345678$');
    await changePasswordButton.click();
    expect(getValidationSummaryMessage()).toHaveText('Re-enter your new password');
  });

  it('sets the passwords and signs in if valid and matching', async () => {
    const passwordField = await $('#password');
    const confirmPasswordField = await $('#confirm-password');
    const changePasswordButton = await getButton('Change password');

    await passwordField.setValue('A12345678$');
    await confirmPasswordField.setValue('A12345678$');
    await changePasswordButton.click();

    expect(browser).toHaveUrlContaining('/add-licences');
    expect(getPageTitle()).toHaveText('Add your licences to the service');
  });

  /**
   * @todo flow where user enters email twice
   * @todo flow where user is already registered
   */
});
