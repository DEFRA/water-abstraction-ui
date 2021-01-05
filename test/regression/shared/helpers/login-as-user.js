/* eslint-disable no-undef */

const loginAsUser = async (baseUrl, userEmail) => {
  try {
    await browser.url(`${baseUrl}/signin`);

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
