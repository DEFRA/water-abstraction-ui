'use strict';

const { setUp } = require('../shared/helpers/setup');
const { loginAsUser, USER_EMAILS } = require('./helpers/login-as-user');
const { getButton, getPageTitle, getPageCaption, getBackLink } = require('../shared/helpers/page');

const EMAIL_ADDRESS = USER_EMAILS.environmentOfficer;

/* eslint-disable no-undef */
describe('change internal user permissions as B&D user', () => {
  before(async () => {
    await setUp();
    await loginAsUser(USER_EMAILS.billingAndData);
  });

  it('searches for user by email address', () => {
    $('#query').setValue(EMAIL_ADDRESS);
    $('.search__button').click();
    expect($('h2')).toHaveText('Users');
    expect($('ul.govuk-list').$$('li')[0]).toHaveText(EMAIL_ADDRESS);
  });

  it('navigates to the user page', () => {
    $('.govuk-list .govuk-link').click();
    expect(browser).toHaveUrlContaining('/status');
    expect(getPageCaption()).toHaveText('Internal');
    expect(getPageTitle()).toHaveText(EMAIL_ADDRESS);
  });

  it('changes the user permissions and navigates to the success page', () => {
    expect($('hr + h1')).toHaveText('Set permissions');
    $('#permission-4').click();
    getButton('Continue').click();
    expect(browser).toHaveUrlContaining('/update-permissions/success');
    expect(getPageTitle()).toHaveText('Account permissions are updated');
  });

  it('user page shows updated permissions', () => {
    getBackLink().click();
    expect($('.govuk-radios__input[checked=""] + label')).toHaveText('National Permitting Service');
  });
});
