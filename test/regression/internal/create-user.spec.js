/* eslint-disable no-undef */
const { loginAsSuperUser } = require('./helpers/loginAsSuper');
const uuid = require('uuid/v4');

describe('creating an internal user:', function () {
  let instanceOfBrowser = browser;
  before(async () => {
    instanceOfBrowser = await loginAsSuperUser();
  });

  describe('navigates to the new internal user form:', () => {
    it('taps on the Manage tab', async () => {
      const manageTabDiv = await instanceOfBrowser.$('#navbar-notifications');
      manageTabDiv.click();
    });
    it('sees the page header', async () => {
      expect(instanceOfBrowser.$('.govuk-heading-l')).toHaveText('Manage reports and notices');
    });
    it('sees the button to create a user', async () => {
      expect(instanceOfBrowser.$('.govuk-heading-l')).toHaveText('Create an internal account');
    });

    after(async () => {
      const createUserURL = await instanceOfBrowser.$('a[href="/account/create-user"]');
      createUserURL.click();
    });
  });

  describe('loads the email form:', () => {
    it('contains the form on the page', async () => {
      expect(instanceOfBrowser.$('form')).toBeVisible();
    });
    it('has an email field label', async () => {
      expect(instanceOfBrowser.$('label.govuk-label')).toHaveText('Enter a gov.uk email address');
    });
    it('has an email field', async () => {
      expect(instanceOfBrowser.$('input#email')).toBeVisible();
    });
    it('has a submit button', async () => {
      expect(instanceOfBrowser.$('button.govuk-button')).toHaveText('Continue');
    });

    after(async () => {
      const submitButton = await instanceOfBrowser.$('button.govuk-button');
      submitButton.click();
    });
  });

  describe('submits the email form:', () => {
    let tempId, tempEmail;
    before(async () => {
      tempId = await uuid();
      tempEmail = `regression.tests.${tempId}@defra.gov.uk`;
    });

    it('sees the email field', async () => {
      expect(instanceOfBrowser.$('input#email')).toBeVisible();
    });
    it('populates the email field', async () => {
      const emailField = await instanceOfBrowser.$('input#email');

      await emailField.setValue(tempEmail);
    });
    it('submits the form', async () => {
      const submitButton = await instanceOfBrowser.$('button[class="govuk-button"]');
      submitButton.click();
    });
  });

  describe('loads the permissions form:', () => {
    it('contains the form on the page', async () => {
      expect(instanceOfBrowser.$('form[action="/account/create-user/set-permissions"]')).toBeVisible();
    });
    it('has eight options', async () => {
      expect(instanceOfBrowser.$('div.govuk-radios')).toHaveChildren(8);
    });
    it('has a submit button', async () => {
      expect(instanceOfBrowser.$('button.govuk-button')).toHaveText('Continue');
    });
  });

  describe('submits the permissions form:', async () => {
    it('can see the permission option', async () => {
      expect(instanceOfBrowser.$('#permission')).toBeVisible();
    });
    it('selects a permission level', async () => {
      const permissionSelected = await instanceOfBrowser.$('#permission');
      permissionSelected.click();
    });
    it('has a submit button', async () => {
      expect(instanceOfBrowser.$('button.govuk-button')).toHaveText('Continue');
    });
    it('submits the form', async () => {
      await instanceOfBrowser.pause(300);
      const submitButton = await instanceOfBrowser.$('button.govuk-button');
      submitButton.click();
      await instanceOfBrowser.pause(300);
    });
  });
});
