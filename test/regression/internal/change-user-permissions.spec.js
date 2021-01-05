'use strict';

const { loginAsUser } = require('../shared/helpers/login-as-user');
const { baseUrl, userEmails } = require('./config');
const { getButton, getPageTitle, getPageCaption, getBackLink } = require('../shared/helpers/page');

const EMAIL_ADDRESS = userEmails.environmentOfficer;

/* eslint-disable no-undef */
describe('change internal user permissions as B&D user', function () {
  before(async () => {
    await loginAsUser(baseUrl, userEmails.billingAndData);
  });

  it('searches for user by email address', async () => {
    const searchField = await $('#query');
    const searchButton = await $('.search__button');

    searchField.setValue(EMAIL_ADDRESS);
    searchButton.click();

    expect($('h2')).toHaveText('Users');
    expect($('ul.govuk-list > li')).toHaveText(EMAIL_ADDRESS);
  });

  it('navigates to the user page', async () => {
    const userPageLink = await $('.govuk-list .govuk-link');
    userPageLink.click();

    expect(browser).toHaveUrlContaining('/status');
    expect(getPageCaption()).toHaveText('Internal');
    expect(getPageTitle()).toHaveText(EMAIL_ADDRESS);
    expect($('hr + h1')).toHaveText('Set permissions');
  });

  it('changes the user permissions and navigates to the success page', async () => {
    const npsRadioOption = await $('#permission-4');
    const button = await getButton('Continue');

    npsRadioOption.click();
    button.click();

    expect(browser).toHaveUrlContaining('/update-permissions/success');
    expect(getPageTitle()).toHaveText('Account permissions are updated');
  });

  it('user page shows updated permissions', async () => {
    const backLink = await getBackLink();
    backLink.click();

    expect($('.govuk-radios__input[checked=""] + label')).toHaveText('National Permitting Service');
  });
});
