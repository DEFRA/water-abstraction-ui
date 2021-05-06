/* /* eslint-disable no-undef */
/* const { loginAsUser } = require('../shared/helpers/login-as-user');
const { getPageTitle } = require('../shared/helpers/page');
const { baseUrl, userEmails } = require('./config');
const moment = require('moment');
const { setUp, tearDown } = require('../shared/helpers/setup'); */

const { setUp, tearDown } = require('../../support/setup');
const moment = require('moment');

/**
 * click the change address link and check the page loads ok
 */
/* const changeAddress = (fao) => {
  it('navigates to the address entry subflow', () => {
    const changeLink = $('[href*="/select-address"]');
    changeLink.click();
  });

  it('check correct form details and page title is displayed for select address', () => {
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Select where to send the form');
    expect(pageTitle).toHaveTextContaining('Licence AT/CURR/MONTHLY/02');
    expect($('form')).toBeVisible();
    const radioButton1 = $('[value="licenceHolder"]');
    const label1 = radioButton1.getElementComputedLabel(radioButton1.elementId);
    expect(label1).toContain('Big Farm Co Ltd');
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
    expect(pageTitle).toHaveTextContaining('Licence AT/CURR/MONTHLY/02');
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
};*/

// check the address is correctly displayed on the returns details page
/*const checkAddress = (address) => {
  it('check the address has been changed correctly', () => {
    cy.get('.govuk-heading-l').should('contain.text', 'Check returns details');
   cy.get('form').should('be.visible');
    const licenceDetails = $('//main/div/div/dl[1]');
    const addressLine = licenceDetails.$('//div[3]/dd[1]');
    cy.get(licenceDetails.$('//div[3]/dt')).contains('Address');
   // cy.get('div.govuk-summary-list__row').eq(2).contains('Address');
    if (address.fao) expect(addressLine).contains(address.fao);
    expect(addressLine).contains('Big Farm Co Ltd'); // can not change the company
    if (address.line1) expect(addressLine).conatins(address.line1);
    if (address.line2) expect(addressLine).contains(address.line2);
    if (address.line3) expect(addressLine).contains(address.line3);
    if (address.line4) expect(addressLine).contains(address.line4);
    if (address.town) expect(addressLine).contains(address.town);
    if (address.county) expect(addressLine).contains(address.county);
    if (address.postcode) expect(addressLine).contains(address.postcode);
    if (address.country) expect(addressLine).contains(address.country);
  });
}; */

describe('Step through the returns paper forms flow:', function () {
  before(() => {
    tearDown();
    setUp('barebones');
    cy.visit(Cypress.env('ADMIN_URI'));
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
    });
  });

  it('navigates to the paper forms flow', () => {
    cy.get('#navbar-notifications').click();

    describe('sees the page header', () => {
      cy.get('.govuk-heading-l').should('contain.text', 'Manage reports and notices');
    });
    describe('sees the link to the paper forms flow', () => {
      cy.get('ul.govuk-list').eq(1).should('contain.text', 'Paper forms');
      cy.get('a[href="/returns-notifications/forms"]').click();
    });

    describe('verify the form,text area,input field and submit button', () => {
      cy.get('form').should('be.visible');
      cy.get('label.govuk-label').should('contain.text', 'Enter a licence number');
      cy.get('#licenceNumbers').should('be.visible');
      cy.get('button.govuk-button').should('contain.text', 'Continue');
    });
    describe('enter an invalid licence number and verify page and the error message', () => {
      cy.get('#licenceNumbers').type('INCORRECT/TEST/LICENCE/NUMBER');
      cy.get('button.govuk-button').click();
      cy.get('.govuk-error-summary').should('be.visible');
      cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem');
      cy.get('.govuk-error-summary__body').should('contain.text', 'The licence number INCORRECT/TEST/LICENCE/NUMBER could not be found');
      cy.get('label.govuk-label').should('contain.text', 'Enter a licence number');
      cy.get('form').should('be.visible');
    });

    describe('enter a single licence number that does not have a return due and verify the correct message', () => {
      cy.get('#licenceNumbers').clear();
      cy.get('#licenceNumbers').type('AT/CURR/MONTHLY/01');
      cy.get('button.govuk-button').click();
      cy.get('label.govuk-label').should('contain.text', 'Enter a licence number');
      cy.get('form').should('be.visible');
      cy.get('.govuk-notification-banner__heading').contains('There are no returns due for licence AT/CURR/MONTHLY/01');
    });

    describe('enter two licence numbers, one with a return due and one without- verify the correct message is displayed', () => {
      cy.get('#licenceNumbers').clear();
      cy.get('#licenceNumbers').type('AT/CURR/MONTHLY/02, AT/CURR/MONTHLY/01');
      cy.get('button.govuk-button').click();
      // the notification banner with the correct message is displayed for the licence with no return due'
      cy.get('.govuk-notification-banner__heading').contains('There are no returns due for licence AT/CURR/MONTHLY/01');
      cy.get('.govuk-heading-l').should('contain.text', 'Check returns details');
      cy.get('.govuk-button').should('contain.text', 'Send paper forms');
      // the licence header is displayed in the list',
      cy.get('.govuk-heading-m').contains('Licence AT/CURR/MONTHLY/02');
    });

    describe('verify the licence return details are displayed in the list', () => {
      cy.get('div.govuk-summary-list__row').eq(0).should('contain.text', 'Licence holder');
      cy.get('div.govuk-summary-list__row').eq(0).children(1).should('contain.text', 'Big Farm Co Ltd');
      cy.get('div.govuk-summary-list__row').eq(1).contains('Returns reference number');
      cy.screenshot();
      cy.get('div.govuk-summary-list__row').eq(1).children(3).should('contain.text', 'Change');
    });

    describe('the licence address details are displayed in the list', () => {
      cy.get('div.govuk-summary-list__row').eq(2).contains('Address');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).should('contain.text','Big Farm Co Ltd');
    });
    // check the address is displayed correctly
    describe('check the address is correct', () => {
      
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains('Big Farm');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains('Windy road');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains('Buttercup meadow');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains('Buttercup Village');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains('Testington');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains('TT1 1TT');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains('UK');
      

    });

  });
});


    

    
    
/*

  describe('change the returns selected for a licence', () => {
    before('click on the change returns link', () => {
      const changeLink = $('[href*="/select-returns"]');
      changeLink.click();
    });

    it('check the correct form and page title is displayed', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Which returns need a form?');
      expect(pageTitle).toHaveTextContaining('Licence AT/CURR/MONTHLY/02');
      expect($('form')).toBeVisible();
    });

    it('remove one returns reference and click continue', () => {
      browser.saveScreenshot(`temp/1.png`);
      const returnId2 = $('input[id="returnIds-2"]');
      returnId2.click();
      const button = $('button[class="govuk-button"]');
      button.click();
    });

    it('check returns details now contains only one returns reference', () => {
      const dueDate = moment('2021-01-28').format('DD MMMM YYYY');
      const licenceDetails = $('//main/div/div/dl[1]');
      licenceDetails.scrollIntoView();
      browser.saveScreenshot(`temp/3.png`);
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[1]/div[1]')).toHaveText('9999991');
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[1]/div[2]')).toHaveText(`Due ${dueDate}`);
      expect(licenceDetails.$('//div[2]/dd[1]/div/div[2]')).not.toBeVisible();
    });
  }); */

/**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Check warning messages for address change subflow
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
/* describe('change address - check form error messages', () => {
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
  }); */

/**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Search by post code and manual address entry
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
/* describe('manually enter address after postcode search', () => {
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
  }); */

/**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Search by postcode and select from the list
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
/* describe('change address - enter post code and search for address', () => {
    // click on the change address link and set the FAO name
    changeAddress('Tester van der Walt');

    it('check enter post code form is correct', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Enter the UK postcode');
      const caption = $('.govuk-caption-l').getText();
      expect(caption).toEqual('Licence AT/CURR/MONTHLY/02');
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
      expect(caption).toEqual('Licence AT/CURR/MONTHLY/02');
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
  }); */

/**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Enter address outside the UK
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
/* describe('enter an address outside the United Kingdom', () => {
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
  }); */

/* describe('Send the paper forms and wait for successful confirmation', () => {
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
  }); */
// });
