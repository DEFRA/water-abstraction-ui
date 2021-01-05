/* eslint-disable no-undef */

const loginAsUser = async (baseUrl, userEmail) => {
  try {
    await browser.url(`${baseUrl}/signin`);
    const SignInButton = await $('button[class="govuk-button govuk-button--start"]');

    let emailField = await $('#email');
    await emailField.setValue(userEmail);

    let passwordField = await $('#password');
    await passwordField.setValue('P@55word');

    await SignInButton.click();
    await browser.pause(500);
  } catch (err) {
    console.log(err);
  }
};

exports.loginAsUser = loginAsUser;
