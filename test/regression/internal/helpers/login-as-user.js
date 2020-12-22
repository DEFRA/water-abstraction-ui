/* eslint-disable no-undef */

const INTERNAL_USERS = {
  super: 'super',
  wirs: 'wirs',
  nps: 'nps',
  npsDigitise: 'nps_digitise',
  npsDigitiseApprover: 'nps_digitise_approver',
  environmentOfficer: 'environment_officer',
  billingAndData: 'billing_and_data',
  psc: 'psc'
};

const USER_EMAILS = {
  super: 'acceptance-test.internal.super@defra.gov.uk',
  wirs: 'acceptance-test.internal.wirs@defra.gov.uk',
  nps: 'acceptance-test.internal.nps@defra.gov.uk',
  nps_digitise: 'acceptance-test.internal.nps_digitise@defra.gov.uk',
  nps_digitise_approver: 'acceptance-test.internal.nps_digitise_approver@defra.gov.uk',
  environment_officer: 'acceptance-test.internal.environment_officer@defra.gov.uk',
  billing_and_data: 'acceptance-test.internal.billing_and_data@defra.gov.uk',
  psc: 'acceptance-test.internal.psc@defra.gov.uk'
};

const loginAsUser = async (user) => {
  try {
    await browser.url('http://localhost:8008/signin');

    let emailField = await $('#email');
    await emailField.setValue(USER_EMAILS[user]);

    let passwordField = await $('#password');
    await passwordField.setValue('P@55word');

    let SignInButton = await $('button[class="govuk-button govuk-button--start"]');
    await SignInButton.click();

    await $('#navbar-notifications').isDisplayed;
  } catch (err) {
    console.log(err);
  }
};

exports.loginAsUser = loginAsUser;
exports.INTERNAL_USERS = INTERNAL_USERS;
exports.USER_EMAILS = USER_EMAILS;
