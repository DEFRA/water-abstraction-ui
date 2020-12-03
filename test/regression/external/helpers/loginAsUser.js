/* eslint-disable no-undef */

const loginAsUser = async () => {
  await browser.url('http://localhost:8000/signin');
  // TODO
};

exports.loginAsUser = loginAsUser;
