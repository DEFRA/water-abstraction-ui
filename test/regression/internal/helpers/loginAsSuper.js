/* eslint-disable no-undef */
const config = require('../config');

const loginAsSuperUser = async () => {
  try {
    await browser.url(`${config.baseUrl}/signin`);

    let emailField = await $('#email');
    await emailField.setValue('acceptance-test.internal.super@defra.gov.uk');

    let passwordField = await $('#password');
    await passwordField.setValue('P@55word');

    let SignInButton = await $('button[class="govuk-button govuk-button--start"]');
    await SignInButton.click();

    await $('#navbar-notifications').isDisplayed;
  } catch (err) {
    console.log(err);
  }
};

exports.loginAsSuperUser = loginAsSuperUser;
