const { describe, before, it } = require('mocha');

/* eslint-disable no-undef */
describe('Login page', function () {
  before(() => {
    browser.url('http://localhost:8000');
  });
  it('has the title of the service', function () {
    expect($("*[class='govuk-header__link govuk-header__link--service-name']"))
      .toHaveText('Manage your water abstraction or impoundment licence');
  });
});
