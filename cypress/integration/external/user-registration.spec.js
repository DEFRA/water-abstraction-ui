const { setUp, tearDown } = require('../../support/setup');

describe('User registration', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });
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
  cy.contains('Create an acount').should('have.class', 'govuk-heading-l');
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
  // const link = await getPersonalisation(baseUrl, EMAIL_ADDRESS, 'link');
  // const pageTitle = await getPageTitle();

  // await browser.url(link);
  // expect(browser).toHaveUrlContaining('/create-password?');
  // expect(pageTitle).toHaveText('Create a password');
});

/* 'use strict';

const { getButton, getPageTitle, getValidationSummaryMessage, getByTestId } = require('../shared/helpers/page');
const { getPersonalisation } = require('../shared/helpers/notifications');
const { baseUrl } = require('./config');

const uuid = require('uuid/v4');
const qs = require('querystring');

const EMAIL_ADDRESS = `${uuid()}@example.com`;

/* eslint-disable no-undef */
/*
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
// });
