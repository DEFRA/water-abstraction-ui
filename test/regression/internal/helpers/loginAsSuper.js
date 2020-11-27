/* eslint-disable no-undef */
const loginAsSuper = async (instanceOfBrowser) => {
  browser.url('http://localhost:8008/signin');

  let emailField = await $('#email');
  emailField.setValue('some text');

  let passwordField = await $('#password');
  passwordField.setValue('some text');

  return browser;
};

exports.loginAsSuper = loginAsSuper;
