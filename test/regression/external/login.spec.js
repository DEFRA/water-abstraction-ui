/* eslint-disable no-undef */
const { loginAsUser } = require('../shared/helpers/login-as-user');
const { baseUrl, userEmails } = require('./config');
const { setUp } = require('../shared/helpers/setup');

describe('Login page', function () {
  before(async () => {
    await setUp('barebones');
    await loginAsUser(baseUrl, userEmails.external);
  });

  it('has the title of the service', async () => {
    const header = await $("*[class='govuk-header__link govuk-header__link--service-name']");
    expect(header).toHaveText('Manage your water abstraction or impoundment licence');
  });
});
