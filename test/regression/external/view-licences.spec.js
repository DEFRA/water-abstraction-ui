'use strict';

const { loginAsUser } = require('../shared/helpers/login-as-user');
const { baseUrl, userEmails } = require('./config');
const { getPageTitle } = require('../shared/helpers/page');
const { setUp } = require('../shared/helpers/setup');
const EMAIL_ADDRESS = userEmails.external;

/* eslint-disable no-undef */
describe('view licences as an external user', function () {
  before(async () => {
    await setUp('users');
    await setUp('licences');
    await loginAsUser(baseUrl, EMAIL_ADDRESS);
  });

  it('sees the page title', async () => {
    const title = await getPageTitle();

    expect(title).toHaveText('Your licences');
  });

  it('sees the licences table', async () => {
    const table = await $('#results');

    expect(table).toBeVisible();
  });

  it('sees the three licences created by the setup routine', async () => {
    const table = await $('#results');

    await expect(table).toHaveTextContaining('AT/CURR/DAILY/01');
    await expect(table).toHaveTextContaining('AT/CURR/WEEKLY/01');
    await expect(table).toHaveTextContaining('AT/CURR/MONTHLY/01');
    await expect(table).not.toHaveTextContaining('AT/CURR/XXXXXX/01');
  });

  it('clicks on the DAILY licence', async () => {
    const dailyLicenceLink = await $('*=DAILY');
    await dailyLicenceLink.click();

    const licencePageHeader = await getPageTitle();

    await expect(licencePageHeader).toBeDisplayed();

    await expect(licencePageHeader).toHaveTextContaining('Licence number AT/CURR/DAILY/01');
  });

  it('sees the Summary table', async () => {
    const table = await $('#summary');

    expect(table).toBeVisible();
  });

  it('checks that the abstraction point is correct, for funsies', async () => {
    const table = await $('#summary');

    expect(table).toHaveTextContaining('At National Grid Reference TQ 123 123 (Test local name)');
  });
});
