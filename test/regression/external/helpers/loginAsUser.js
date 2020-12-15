/* eslint-disable no-undef */

const loginAsUser = async () => {
  await browser.url('http://localhost:8000/signin');

  let emailField = await $('#email');
  await emailField.setValue('acceptance-test.external@example.com');

  let passwordField = await $('#password');
  await passwordField.setValue('P@55word');

  let SignInButton = await $('button[class="govuk-button govuk-button--start"]');
  await SignInButton.click();

  await $('#navbar-notifications').isDisplayed;
};

exports.loginAsUser = loginAsUser;
