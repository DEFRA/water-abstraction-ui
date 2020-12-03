/* eslint-disable no-undef */
const { loginAsUser } = require('./helpers/loginAsUser');

describe('Login page', function () {
  before(async () => {
    await loginAsUser();
  });

  it('has the title of the service', async () => {
    const header = await $("*[class='govuk-header__link govuk-header__link--service-name']");
    expect(header).toHaveText('Manage your water abstraction or impoundment licence');
  });
});
