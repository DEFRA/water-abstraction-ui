/* eslint-disable no-undef */
const { loginAsSuperUser } = require('./helpers/loginAsSuper');
const uuid = require('uuid/v4');

describe('creating an internal user:', function () {
  before(async () => {
    await loginAsSuperUser();
  });

  describe('navigates to the new internal user form:', () => {
    it('taps on the Manage tab', async () => {
      const manageTabDiv = await $('#navbar-notifications');
      manageTabDiv.click();
    });
    it('sees the page header', async () => {
      expect($('.govuk-heading-l')).toHaveText('Manage reports and notices');
    });
    it('sees the button to create a user', async () => {
      expect($('.govuk-heading-l')).toHaveText('Create an internal account');
    });

    after(async () => {
      const button = await $('a[href="/account/create-user"]');
      button.click();
    });
  });

  describe('loads the email form:', () => {
    it('contains the form on the page', async () => {
      expect($('form')).toBeVisible();
    });
    it('has an email field label', async () => {
      expect($('label.govuk-label')).toHaveText('Enter a gov.uk email address');
    });
    it('has an email field', async () => {
      expect($('input#email')).toBeVisible();
    });
    it('has a submit button', async () => {
      expect($('button.govuk-button')).toHaveText('Continue');
    });
  });

  describe('submits the email form:', () => {
    let tempId, tempEmail;
    before(async () => {
      tempId = await uuid();
      tempEmail = `regression.tests.${tempId}@defra.gov.uk`;
    });

    it('sees the email field', async () => {
      expect($('input#email')).toBeVisible();
    });
    it('populates the email field', async () => {
      const field = await $('input#email');
      field.setValue(tempEmail);
    });
    it('submits the form', async () => {
      const button = await $('button[class="govuk-button"]');
      button.click();
    });
  });

  describe('loads the permissions form:', () => {
    it('contains the form on the page', async () => {
      expect($('form[action="/account/create-user/set-permissions"]')).toBeVisible();
    });
    it('has eight options', async () => {
      expect($('div.govuk-radios')).toHaveChildren(8);
    });
    it('has a submit button', async () => {
      expect($('button.govuk-button')).toHaveText('Continue');
    });
  });

  describe('submits the permissions form:', async () => {
    it('can see the permission option', async () => {
      expect($('#permission')).toBeVisible();
    });
    it('selects a permission level', async () => {
      const permissionSelected = await $('#permission');
      permissionSelected.click();
    });
    it('has a submit button', async () => {
      expect($('button.govuk-button')).toHaveText('Continue');
    });
    it('submits the form', async () => {
      await browser.pause(300);
      const submitButton = await $('button.govuk-button');
      submitButton.click();
      await browser.pause(300);
    });
  });
});
