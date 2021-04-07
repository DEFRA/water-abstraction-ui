'use strict';

const { setUp, tearDown } = require('../shared/helpers/setup');
const { loginAsUser } = require('../shared/helpers/login-as-user');
const { baseUrl, userEmails } = require('./config');
const { getPageTitle } = require('../shared/helpers/page');

// The table is sorted by licence start date and the test workflow is created
// with an early start date to guarantee that it will be in the first row
const firstRowSelector = '#toSetUp .govuk-table > tbody:nth-child(2) > tr:nth-child(1)';

/* eslint-disable no-undef */
describe('remove charge info workflow as B&D user', function () {
  before(async () => {
    await tearDown();
    await setUp('charge-version-workflow');
    await loginAsUser(baseUrl, userEmails.billingAndData);
  });

  it('navigates to manage', async () => {
    const manageTabDiv = await $('#navbar-notifications');
    manageTabDiv.click();
    const page = await $('main');

    expect(page).toHaveTextContaining('View charge information workflow');
  });

  it('navigates to charge info workflow page', async () => {
    const workflowLink = await $('[href*="/charge-information-workflow"]');
    await workflowLink.click();

    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Charge information workflow');
  });

  it('sees the workflow tabs', async () => {
    const workflowTabs = await $('.govuk-tabs');

    expect(workflowTabs).toHaveTextContaining('To set up');
    expect(workflowTabs).toHaveTextContaining('Review');
    expect(workflowTabs).toHaveTextContaining('Change request');
  });

  it('sees the expected workflow in the table', async () => {
    const toSetUpFirstRow = await $(firstRowSelector);

    expect(toSetUpFirstRow).toHaveTextContaining('AT/CURR/DAILY/01');
    expect(toSetUpFirstRow).toHaveTextContaining('Big Farm Co Ltd');
    expect(toSetUpFirstRow).toHaveTextContaining('1 April 1920');
  });

  it('sees the action links against the workflow and clicks the Remove link ', async () => {
    const setUpLink = await $(`${firstRowSelector} [href$="/charge-information/create"]`);
    const removeLink = await $(`${firstRowSelector} [href$="/remove"]`);

    expect(setUpLink).toHaveTextContaining('Set up');
    expect(removeLink).toHaveTextContaining('Remove');

    await removeLink.click();
  });

  it('sees confirmation page', async () => {
    expect(browser).toHaveUrlContaining('/charge-information-workflow');
    expect(browser).toHaveUrlContaining('/remove');

    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining("You're about to remove this licence from the workflow");
  });

  it('sees the data on the confirmation page', async () => {
    const confirmationDataTable = await $('.govuk-table');
    expect(confirmationDataTable).toHaveTextContaining('123/456');
    expect(confirmationDataTable).toHaveTextContaining('Mr John Testerton');
    expect(confirmationDataTable).toHaveTextContaining('1 April 2008');
  });

  it('clicks remove button and is redirected back to workflow page', async () => {
    const button = await $('.govuk-button');
    await button.click();

    expect(browser).toHaveUrlContaining('/charge-information-workflow');
  });

  it('removes workflow and sees that it has been removed', async () => {
    const toSetUpTable = await $('#toSetUp .govuk-table');

    expect(toSetUpTable).not.toHaveTextContaining('123/456');
    expect(toSetUpTable).not.toHaveTextContaining('Mr John Testerton');
    expect(toSetUpTable).not.toHaveTextContaining('1 April 2008');
  });
});
