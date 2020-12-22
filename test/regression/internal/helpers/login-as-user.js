/* eslint-disable no-undef */

const USER_EMAILS = {
  super: 'acceptance-test.internal.super@defra.gov.uk',
  wirs: 'acceptance-test.internal.wirs@defra.gov.uk',
  nps: 'acceptance-test.internal.nps@defra.gov.uk',
  npsDigitise: 'acceptance-test.internal.nps_digitise@defra.gov.uk',
  npsDigitiseApprover: 'acceptance-test.internal.nps_digitise_approver@defra.gov.uk',
  environmentOfficer: 'acceptance-test.internal.environment_officer@defra.gov.uk',
  billingAndData: 'acceptance-test.internal.billing_and_data@defra.gov.uk',
  psc: 'acceptance-test.internal.psc@defra.gov.uk'
};

const loginAsUser = async (userEmail) => {
  try {
    await browser.url('http://localhost:8008/signin');

    let emailField = await $('#email');
    await emailField.setValue(userEmail);

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
exports.USER_EMAILS = USER_EMAILS;
