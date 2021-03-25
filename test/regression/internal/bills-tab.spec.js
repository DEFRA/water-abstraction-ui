/* eslint-disable no-undef */
const { loginAsUser } = require('../shared/helpers/login-as-user');
const { getPageTitle } = require('../shared/helpers/page');
const { baseUrl, userEmails } = require('./config');
const { setUp, tearDown } = require('../shared/helpers/setup');

const LICENCE_NUMBER = 'AT/CURR/DAILY/01';
const firstLicenceSearchResult = '.govuk-table__body > tr:nth-child(1) > td:nth-child(1)';

describe('non-charging user unable to view bills tab', function () {
  before(async () => {
    await tearDown();
    await setUp('billing-data');
    await loginAsUser(baseUrl, userEmails.psc);
  });

  it('searches for licence by licence number', async () => {
    const searchField = await $('#query');
    const searchButton = await $('.search__button');

    await searchField.setValue(LICENCE_NUMBER);
    await searchButton.click();

    const h2 = await $('h2');
    const firstSearchResult = await $(firstLicenceSearchResult);

    expect(h2).toHaveText('Licences');
    expect(firstSearchResult).toHaveText(LICENCE_NUMBER);
  });

  it('navigates to the licence page', async () => {
    const licencePageLink = await $(`${firstLicenceSearchResult} > a`);
    await licencePageLink.click();

    expect(browser).toHaveUrlContaining('/licences/');
    expect(getPageTitle()).toHaveText(LICENCE_NUMBER);
  });

  it('sees the licence tabs and the bills tab is not shown', async () => {
    const licenceTabs = await $('.govuk-tabs__list');

    expect(licenceTabs).toHaveTextContaining('Summary');
    expect(licenceTabs).toHaveTextContaining('Communications');
    expect(licenceTabs).not.toHaveTextContaining('Returns');
    expect(licenceTabs).not.toHaveTextContaining('Bills');
    expect(licenceTabs).not.toHaveTextContaining('Charge Information');
  });
});

describe('B&D user able to view bills tab', function () {
  before(async () => {
    await tearDown();
    await setUp('billing-data');
    await loginAsUser(baseUrl, userEmails.billingAndData);
  });

  it('searches for licence by licence number', async () => {
    const searchField = await $('#query');
    const searchButton = await $('.search__button');

    await searchField.setValue(LICENCE_NUMBER);
    await searchButton.click();

    expect($('h2')).toHaveText('Licences');
    expect($(firstLicenceSearchResult)).toHaveText(LICENCE_NUMBER);
  });

  it('navigates to the licence page', async () => {
    const licencePageLink = await $(`${firstLicenceSearchResult} > a`);
    await licencePageLink.click();

    expect(browser).toHaveUrlContaining('/licences/');
    expect(getPageTitle()).toHaveText(LICENCE_NUMBER);
  });

  it('sees the licence tabs and the bills tab is not shown', async () => {
    const licenceTabs = await $('.govuk-tabs__list');

    expect(licenceTabs).toHaveTextContaining('Summary');
    expect(licenceTabs).toHaveTextContaining('Returns');
    expect(licenceTabs).toHaveTextContaining('Communications');
    expect(licenceTabs).toHaveTextContaining('Bills');
    expect(licenceTabs).toHaveTextContaining('Charge Information');
  });

  it('navigates to the Bills tab', async () => {
    const billsTabLink = await $('a#tab_bills');
    await billsTabLink.click();

    const billsHeading = await $('#bills > h2');

    expect(billsHeading).toHaveTextContaining('Bills');
  });

  it('sees the bills table displaying invoice data', async () => {
    const billsTable = await $('#bills > .govuk-table');
    expect(billsTable).toBeVisible();

    const tableRow = await $('#bills .govuk-table__body tr');
    expect(tableRow).toHaveTextContaining('SAI10000100'); // Bill number
    expect(tableRow).toHaveTextContaining('A99999999A'); // Billing account
    expect(tableRow).toHaveTextContaining('Annual'); // Bill run type
    expect(tableRow).toHaveTextContaining('2021'); // Financial year
    expect(tableRow).toHaveTextContaining('£1,245.67'); // Bill total
  });
});
