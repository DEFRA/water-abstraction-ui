/* eslint-disable no-undef */
const { loginAsUser } = require('../shared/helpers/login-as-user');
const { getPageTitle } = require('../shared/helpers/page');
const { baseUrl, userEmails } = require('./config');
const moment = require('moment');

/**
 * click the change address link and check the page loads ok
 */
const changeAddress = (fao) => {
  it('navigates to the address entry subflow', () => {
    const changeLink = $('[href*="/select-address"]');
    changeLink.click();
  });

  it('check correct form details and page title is displayed for select address', () => {
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Select where to send the form');
    expect(pageTitle).toHaveTextContaining('Licence AT/CURR/MONTHLY/01');
    expect($('form')).toBeVisible();
    const radioButton1 = $('[value="licenceHolder"]');
    const label1 = radioButton1.getElementComputedLabel(radioButton1.elementId);
    expect(label1).toContain('acceptance-test-company, Test Address Line 1');
    expect($('.govuk-radios__divider=Or')).toBeVisible();
    const radioButton2 = $('[value="createOneTimeAddress"]');
    const label2 = radioButton2.getElementComputedLabel(radioButton2.elementId);
    expect(label2).toEqual('Set up a one time address');
    radioButton2.click();
    const button = $('button[class="govuk-button"]');
    button.click();
  });

  it('enters full name for FAO', () => {
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Who should receive the form?');
    expect(pageTitle).toHaveTextContaining('Licence AT/CURR/MONTHLY/01');
    expect($('form')).toBeVisible();
    const hint = $('[id="fullName-hint"]').getText();
    expect(hint).toEqual('Enter full name');
    const textBox = $('[name="fullName"]');
    expect(textBox).toBeVisible();

    // enter the full name and continue
    textBox.setValue(fao);
    const button = $('button[class="govuk-button"]');
    button.click();
  });
};

// check the address is correctly displayed on the returns details page
const checkAddress = (address) => {
  it('check the address has been changed correctly', () => {
    const pageTitleElement = getPageTitle();
    expect(pageTitleElement).toHaveText('Check returns details');
    expect($('form')).toBeVisible();
    const licenceDetails = $('//main/div/div/dl[1]');
    const addressLine = licenceDetails.$('//div[3]/dd[1]');
    expect(licenceDetails.$('//div[3]/dt')).toHaveText('Address');
    if (address.fao) expect(addressLine).toHaveTextContaining(address.fao);
    expect(addressLine).toHaveTextContaining('acceptance-test-company'); // can not change the company
    if (address.line1) expect(addressLine).toHaveTextContaining(address.line1);
    if (address.line2) expect(addressLine).toHaveTextContaining(address.line2);
    if (address.line3) expect(addressLine).toHaveTextContaining(address.line3);
    if (address.line4) expect(addressLine).toHaveTextContaining(address.line4);
    if (address.town) expect(addressLine).toHaveTextContaining(address.town);
    if (address.county) expect(addressLine).toHaveTextContaining(address.county);
    if (address.postcode) expect(addressLine).toHaveTextContaining(address.postcode);
    if (address.country) expect(addressLine).toHaveTextContaining(address.country);
  });
};

describe('Step through the returns paper forms flow:', function () {
  before(async () => {
    await loginAsUser(baseUrl, userEmails.super);
  });

  describe('navigates to the paper forms flow', () => {
    before(async () => {
      const manageTabDiv = await $('#navbar-notifications');
      await manageTabDiv.click();
    });
    it('sees the page header', () => {
      expect($('.govuk-heading-l')).toHaveText('Manage reports and notices');
    });
    it('sees the link to the paper forms flow', () => {
      const linkText = $('a=Paper forms');
      expect(linkText.getText()).toEqual('Paper forms');
    });

    after(async () => {
      const button = await $('a[href="/returns-notifications/forms"]');
      button.click();
    });
  });

  describe('loads the paper forms flow form:', () => {
    it('contains the form on the page', () => {
      expect($('form')).toBeVisible();
    });
    it('has a text area field label', () => {
      expect($('label.govuk-label')).toHaveText('Enter a licence number');
    });
    it('has an email field', () => {
      expect($('textarea#licenceNumbers')).toBeVisible();
    });
    it('has a submit button', () => {
      expect($('button.govuk-button')).toHaveText('Continue');
    });
  });

  describe('enter an invalid licence number', () => {
    before('populates the text area field', () => {
      const field = $('#licenceNumbers');
      field.setValue('INCORRECT/TEST/LICENCE/NUMBER');
      const button = $('button[class="govuk-button"]');
      button.click();
    });
    it('the user is redeirected back to the same page', () => {
      const pageTitleElement = getPageTitle();
      expect(pageTitleElement).toHaveText('Enter a licence number');
      expect($('form')).toBeVisible();
    });
    it('it sees the correct error message', () => {
      const errorSummary = $('.govuk-error-summary');
      const errorSummaryTitle = $('.govuk-error-summary__title');
      const errorSummaryBody = $('.govuk-error-summary__body');
      expect(errorSummary).toBeVisible();
      expect(errorSummaryTitle).toHaveText('There is a problem');
      expect(errorSummaryBody).toHaveText('The licence number INCORRECT/TEST/LICENCE/NUMBER could not be found');
    });
  });

  describe('enter a single licence number that does not have a return due', () => {
    before('populates the text area field', () => {
      const field = $('#licenceNumbers');
      field.setValue('AT/CURR/MONTHLY/02');
      const button = $('button[class="govuk-button"]');
      button.click();
    });
    it('the user is redeirected back to the same page', () => {
      const pageTitleElement = getPageTitle();
      expect(pageTitleElement).toHaveText('Enter a licence number');
      expect($('form')).toBeVisible();
    });
    it('it sees the notification banner with the correct message', () => {
      const notificationBanner = $('.govuk-notification-banner__heading*=There are no returns due');
      expect(notificationBanner).toHaveText('There are no returns due for licence AT/CURR/MONTHLY/02');
    });
  });

  describe('enter two licence numbers, one with a return due and one without', () => {
    before('populates the text area field with the licence numbers and clicks submit', () => {
      const field = $('#licenceNumbers');
      field.setValue('AT/CURR/MONTHLY/02, AT/CURR/MONTHLY/01');
      const button = $('button[class="govuk-button"]');
      button.click();
    });
    it('the check returns details page is displayed', () => {
      const pageTitleElement = getPageTitle();
      expect(pageTitleElement).toHaveText('Check returns details');
      expect($('form')).toBeVisible();
    });
    it('the notification banner with the correct message is displayed for the licence with no return due', () => {
      const notificationBanner = $('.govuk-notification-banner__heading*=There are no returns due');
      expect(notificationBanner).toHaveText('There are no returns due for licence AT/CURR/MONTHLY/02');
    });
    it('the licence header is displayed in the list', () => {
      const licenceMonthly = $('//main/div/div').$('h2*=MONTHLY');
      expect(licenceMonthly).toHaveText('Licence AT/CURR/MONTHLY/01');
    });

    it('the licence return details are displayed in the list', () => {
      const dueDateThisYear = moment().add(1, 'month').format('YYYY-MM-DD');
      const dueDateLastYear = moment().add(-1, 'year').format('YYYY-MM-DD');
      const licenceDetails = $('//main/div/div/dl[1]');
      expect(licenceDetails.$('//div[1]/dt')).toHaveText('Licence holder');
      expect(licenceDetails.$('//div[1]/dd')).toHaveText('acceptance-test-company');
      expect(licenceDetails.$('//div[2]/dt')).toHaveText('Returns reference numbers');
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[1]/div[1]')).toHaveText('9999993');
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[1]/div[2]')).toHaveText(`Due ${dueDateThisYear}`);
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[2]/div[1]')).toHaveText('9999994');
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[2]/div[2]')).toHaveText(`Due ${dueDateLastYear}`);
      expect(licenceDetails.$('//div[2]/dd[2]/a')).toHaveTextContaining('Change');
    });

    it('the licence address details are displayed in the list', () => {
      const licenceDetails = $('//main/div/div/dl[1]');
      const addressLine = licenceDetails.$('//div[3]/dd[1]');
      expect(licenceDetails.$('//div[3]/dt')).toHaveText('Address');
      expect(addressLine).toHaveTextContaining('acceptance-test-company');
    });

    // check the address is displayed correctly
    checkAddress({
      line1: 'Test Address Line 1',
      line2: 'Test Address Line 2',
      line3: 'Test Address Line 3',
      line4: 'Test Address Line 4',
      town: 'SomeCity',
      country: 'Lebanon'
    });

    it('the licence has an address change link', () => {
      const licenceDetails = $('//main/div/div/dl[1]');
      expect(licenceDetails.$('//div[3]/dd[2]/a')).toHaveTextContaining('Change');
    });
  });

  describe('change the returns selected for a licence', () => {
    before('click on the change returns link', () => {
      const changeLink = $('[href*="/select-returns"]');
      changeLink.click();
    });

    it('check the correct form and page title is diaplayed', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Which returns need a form?');
      expect(pageTitle).toHaveTextContaining('Licence AT/CURR/MONTHLY/01');
      expect($('form')).toBeVisible();
    });

    it('remove one returns reference and click continue', () => {
      const returnId2 = $('input[id="returnIds-2"]');
      returnId2.click();
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    it('check returns details now contains only one returns reference', () => {
      const dueDateThisYear = moment().add(1, 'month').format('YYYY-MM-DD');
      const licenceDetails = $('//main/div/div/dl[1]');
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[1]/div[1]')).toHaveText('9999993');
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[1]/div[2]')).toHaveText(`Due ${dueDateThisYear}`);
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[2]')).not.toBeVisible();
    });
  });

  /**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Check warning messages for address change subflow
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
  describe('change address - check form error messages', () => {
    // click on the change address link and set the FAO name
    it('navigates to the change address subflow', () => {
      const changeLink = $('[href*="/select-address"]');
      changeLink.click();
    });

    it('select option to setup address', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Select where to send the form');
      const radioButton2 = $('[value="createOneTimeAddress"]');
      const label2 = radioButton2.getElementComputedLabel(radioButton2.elementId);
      expect(label2).toEqual('Set up a one time address');
      radioButton2.click();
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    it('checks correct page is displayed', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Who should receive the form?');
      expect($('form')).toBeVisible();
      const textBox = $('input[name="fullName"]');
      expect(textBox).toBeVisible();

      // enter an empty string and continue
      textBox.setValue('');
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    it('checks the correct error message is displayed', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Who should receive the form?');
      const errorSummary = $('.govuk-error-summary');
      const errorSummaryTitle = $('.govuk-error-summary__title');
      const errorSummaryBody = $('.govuk-error-summary__body');
      const textBoxError = $('#fullName-error');
      expect(textBoxError).toHaveTextContaining('Enter a full name');
      expect(errorSummary).toBeVisible();
      expect(errorSummaryTitle).toHaveText('There is a problem');
      expect(errorSummaryBody).toHaveText('Enter a full name');
    });

    it('enters a full name and continues', () => {
      const textBox = $('input[name="fullName"]');
      expect(textBox).toBeVisible();

      // enter an empty string and continue
      textBox.setValue('Tester2 Oosthuizen');
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    it('check enter post code form is correct', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Enter the UK postcode');
      expect($('form')).toBeVisible();
      const textBox = $('input[name="postcode"]');
      expect(textBox).toBeVisible();

      // enter an empty string and continue
      textBox.setValue('');
      const button = $('button[class="govuk-button"]');
      button.click();
    });
    it('checks the correct error message is displayed on the postcode entry form', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Enter the UK postcode');
      const errorSummary = $('.govuk-error-summary');
      const errorSummaryTitle = $('.govuk-error-summary__title');
      const errorSummaryBody = $('.govuk-error-summary__body');
      const textBoxError = $('#postcode-error');
      expect(textBoxError).toHaveTextContaining('Enter a UK postcode');
      expect(errorSummary).toBeVisible();
      expect(errorSummaryTitle).toHaveText('There is a problem');
      expect(errorSummaryBody).toHaveText('Enter a UK postcode');
    });

    it('enters a postcode and continue', () => {
      const textBox = $('input[name="postcode"]');
      expect(textBox).toBeVisible();
      textBox.setValue('EX1 1QA');
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    it('do not select an address from the list, click continue and checks the errors', () => {
      // click contiinue without selecting an address
      const button = $('button[class="govuk-button"]');
      button.click();
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Select the address');
      const errorSummary = $('.govuk-error-summary');
      const errorSummaryTitle = $('.govuk-error-summary__title');
      const errorSummaryBody = $('.govuk-error-summary__body');
      const textBoxError = $('#uprn-error');
      expect(textBoxError).toHaveTextContaining('Select an address from the list');
      expect(errorSummary).toBeVisible();
      expect(errorSummaryTitle).toHaveText('There is a problem');
      expect(errorSummaryBody).toHaveText('Select an address from the list');
    });

    it('click on the I cannot find the address in the list link', () => {
      const link = $('=I cannot find the address in the list');
      link.click();
    });

    it('sees the address entry form, sets the input values to empty and continues', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Enter the address');
      expect($('form')).toBeVisible();
      const postcode = $('input[name="postcode"]');
      const country = $('select[name="country"]');

      // make sure the form inputs are empty
      postcode.setValue('');
      country.click();
      const option = $('//select/option[1]');
      option.click();
      // click continue to display form errors
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    it('checks address entry errors', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Enter the address');
      const errorSummary = $('.govuk-error-summary');
      const errorSummaryTitle = $('.govuk-error-summary__title');
      const errorSummaryBodyLine1 = $('a[href="#addressLine2"]');
      const errorSummaryBodyLine2 = $('a[href="#addressLine4"]');
      const errorSummaryBodyLine3 = $('a[href="#country"]');
      expect(errorSummary).toBeVisible();
      expect(errorSummaryTitle).toHaveText('There is a problem');
      expect(errorSummaryBodyLine1).toHaveTextContaining('Enter either a building number or building name');
      expect(errorSummaryBodyLine2).toHaveTextContaining('Enter either a street name or town or city');
      expect(errorSummaryBodyLine3).toHaveTextContaining('Select a country');
    });
  });

  /**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Search by post code and manual address entry
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
  describe('manually enter address after postcode search', () => {
    const address = {
      fao: 'Tester2 Oosthuizen',
      line1: 'Sub-building',
      line2: 'Building number',
      line3: 'Buildng Name',
      line4: 'Street Name',
      county: 'RainingAllTheTimeShire',
      postcode: 'RA1 1AN',
      country: 'United Kingdom'
    };

    it('sees the address entry form', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Enter the address');
      expect($('form')).toBeVisible();
      const addressLine1 = $('input[name="addressLine1"]');
      const addressLine2 = $('input[name="addressLine2"]');
      const addressLine3 = $('input[name="addressLine3"]');
      const addressLine4 = $('input[name="addressLine4"]');
      const town = $('input[name="town"]');
      const county = $('input[name="county"]');
      const postcode = $('input[name="postcode"]');
      const country = $('select[name="country"]');

      addressLine1.setValue(address.line1);
      addressLine2.setValue(address.line2);
      addressLine3.setValue(address.line3);
      addressLine4.setValue(address.line4);
      town.setValue(address.town);
      county.setValue(address.county);
      postcode.setValue(address.postcode);
      country.click();
      const option = $('option[value="United Kingdom"]');
      option.click();
    });

    it('clicks the continue button', () => {
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    checkAddress(address);
  });

  /**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Search by postcode and select from the list
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
  describe('change address - enter post code and search for address', () => {
    // click on the change address link and set the FAO name
    changeAddress('Tester van der Walt');

    it('check enter post code form is correct', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Enter the UK postcode');
      const caption = $('.govuk-caption-l').getText();
      expect(caption).toEqual('Licence AT/CURR/MONTHLY/01');
      expect($('form')).toBeVisible();
      const textBox = $('input[name="postcode"]');
      expect(textBox).toBeVisible();

      // enter the postcode and continue
      textBox.setValue('EX1 1QA');
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    it('check and select address from list', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Select the address');
      const caption = $('.govuk-caption-l').getText();
      expect(caption).toEqual('Licence AT/CURR/MONTHLY/01');
      expect($('form')).toBeVisible();
      const selectList = $('select[class="govuk-select"]');
      expect(selectList).toBeVisible();
      // click on the dropdown list to display all the options
      selectList.click();
      // pick the option and click on it
      const option = $('option[value="10013050863"]');
      option.click();
      // click on continue
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    checkAddress({
      fao: 'FAO Tester van der Walt',
      line1: '6',
      line2: 'PRINCESSHAY',
      town: 'EXETER',
      postcode: 'EX1 1GE',
      country: 'United Kingdom'
    });
  });

  /**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Enter address outside the UK
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
  describe('enter an address outside the United Kingdom', () => {
    const address = {
      line1: 'Sub-building',
      line2: 'Building number',
      line3: 'Buildng Name',
      line4: 'Street Name',
      county: 'RainingAllTheTimeShire',
      postcode: 'RA1 N',
      country: 'Croatia'
    };

    it('the check returns details page is displayed', () => {
      const pageTitleElement = getPageTitle();
      expect(pageTitleElement).toHaveText('Check returns details');
      expect($('form')).toBeVisible();
    });

    // click on the change address link and check the form has loaded
    changeAddress('Tester2 Oosthuizen');

    it('click on the I cannot find the address in the list link', () => {
      const link = $('=This address is outside the UK');
      link.click();
    });

    it('sees the address entry form', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Enter the address');
      expect($('form')).toBeVisible();
      const addressLine1 = $('input[name="addressLine1"]');
      const addressLine2 = $('input[name="addressLine2"]');
      const addressLine3 = $('input[name="addressLine3"]');
      const addressLine4 = $('input[name="addressLine4"]');
      const town = $('input[name="town"]');
      const county = $('input[name="county"]');
      const postcode = $('input[name="postcode"]');
      const country = $('select[name="country"]');

      addressLine1.setValue(address.line1);
      addressLine2.setValue(address.line2);
      addressLine3.setValue(address.line3);
      addressLine4.setValue(address.line4);
      town.setValue(address.town);
      county.setValue(address.county);
      postcode.setValue(address.postcode);
      country.click();
      const option = $('option[value="Croatia"]');
      option.click();
    });

    it('clicks the continue button', () => {
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    checkAddress(address);
  });

  describe('Send the paper forms and wait for successful confirmation', () => {
    it('check Paper return forms has been sent', () => {
      // click send paper forms
      const button = $('button[class="govuk-button"]');
      button.click();
      // sleep for 5 seconds to avoid temporary spinner page
      browser.pause(5000);
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Paper return forms sent');
      const subtitle = $('.govuk-panel__body');
      expect(subtitle).toHaveText('They will arrive in three to five working days');
    });
  });
});
