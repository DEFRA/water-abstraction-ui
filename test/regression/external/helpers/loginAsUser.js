/* eslint-disable no-undef */

const loginAsUser = async (instanceOfBrowser) => {
  await instanceOfBrowser.url('http://localhost:8000/signin');

  // TODO
  return instanceOfBrowser;
};

exports.loginAsUser = loginAsUser;
