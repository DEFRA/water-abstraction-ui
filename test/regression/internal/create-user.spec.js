const { loginAsSuper } = require('./helpers/loginAsSuper');

/* eslint-disable no-undef */
describe('Login page', function () {
  let instanceOfBrowser = browser;
  before(async () => {
    instanceOfBrowser = await loginAsSuper();
  });
  it('has the title of the service', function () {
    expect(instanceOfBrowser.$("*[class='govuk-header__link govuk-header__link--service-name']"))
      .toHaveText('Manage your water abstraction or impoundment licence');
  });

  it('has a search button', () => {
    expect(instanceOfBrowser.$('.search__button')).toBeDisabled();
  });
});
