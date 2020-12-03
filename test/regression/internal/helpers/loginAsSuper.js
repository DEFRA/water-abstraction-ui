/* eslint-disable no-undef */

const loginAsSuperUser = async (instanceOfBrowser) => {
  const loginPage = await instanceOfBrowser.url('http://localhost:8008/signin');

  let emailField = await loginPage.$('#email');
  await emailField.setValue('regression.tests@defra.gov.uk');

  let passwordField = await loginPage.$('#password');
  await passwordField.setValue('regression.tests#100');

  let SignInButton = await loginPage.$('button[class="govuk-button govuk-button--start"]');
  await SignInButton.click();

  await loginPage.$('#navbar-notifications').isDisplayed;

  return instanceOfBrowser;
};

exports.loginAsSuperUser = loginAsSuperUser;
