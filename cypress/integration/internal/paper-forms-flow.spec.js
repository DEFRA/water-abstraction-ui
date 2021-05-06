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
}; */

// check the address is correctly displayed on the returns details page
/* const checkAddress = (address) => {
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
      cy.screenshot('temp/2.png');
      cy.get('div.govuk-summary-list__row').eq(1).children(3).should('contain.text', 'Change');
    });

    describe('the licence address details are displayed in the list', () => {
      cy.get('div.govuk-summary-list__row').eq(2).contains('Address');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).should('contain.text', 'Big Farm Co Ltd');
    });
    // check the address is displayed correctly

    const checkAddress = {
      line1: 'Big Farm',
      line2: 'Windy road',
      line3: 'Buttercup meadow',
      line4: 'Buttercup Village',
      town: 'Testington',
      postcode: 'TT1 1TT',
      country: 'UK'
    };

    describe('check the address is correct', () => {
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(checkAddress.line1);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(checkAddress.line2);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(checkAddress.line3);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(checkAddress.line4);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(checkAddress.town);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(checkAddress.postcode);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(checkAddress.country);
    });

    describe('change the returns selected for a licence,verify the correct form and page title are displayed', () => {
      cy.get('[href*="/select-returns"]').click();
      cy.get('.govuk-fieldset__heading').contains('Which returns need a form?');
      cy.get('.govuk-caption-l').contains('Licence AT/CURR/MONTHLY/02');
      cy.get('form').should('be.visible');
    });
    describe('remove one returns reference and click continue', () => {
      cy.screenshot('temp/1.png');
      cy.get('input[id="returnIds-3"]').uncheck();
      cy.get('input[id="returnIds-2"]').check();
      cy.get('button[class="govuk-button"]').click();
    });
    describe('check returns details now contains only one returns reference', () => {
      const dueDate = moment('2021-01-28').format('DD MMMM YYYY');
      cy.screenshot('temp/3.png');
      cy.get('.meta__key').contains('9999991');
      cy.get('.meta__value').should('contain', 'Due ' + dueDate);
      cy.get(':nth-child(2) > .govuk-summary-list__value').should('have.length', '1');
    });
    /**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Check warning messages for address change subflow
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
    // change address - check form error messages

    describe('navigates to the change address subflow', () => {
    // click on the change address link and set the FAO name
      cy.get('[href*="/select-address"]').click();
    });

    describe('select option to setup address', () => {
      cy.get('.govuk-fieldset__heading').contains('Select where to send the form');
      cy.get('div.govuk-radios').children(2).contains('Set up a one time address');
      cy.get('#selectedRole-3').check();
      cy.get('button.govuk-button').click();
    });

    describe('checks correct page is displayed', () => {
      cy.get('.govuk-label').contains('Who should receive the form?');
      cy.get('form').should('be.visible');
      cy.get('input[name="fullName"]').should('be.visible');
      // enter an empty string and continue
      cy.get('input[name="fullName"]').type(' ');
      cy.get('button.govuk-button').click();
    });

    describe('checks the correct error message is displayed', () => {
      cy.get('.govuk-label').contains('Who should receive the form?');
      cy.get('.govuk-error-summary').should('be.visible');
      cy.get('.govuk-error-summary__title').should('contain', 'There is a problem');
      cy.get('.govuk-error-summary__body').should('contain', 'Enter a full name');
      cy.get('#fullName-error').should('contain', 'Enter a full name');
    });

    describe('enters a full name and continues', () => {
      cy.get('input[name="fullName"]').should('be.visible');
      cy.get('input[name="fullName"]').type('Tester2 Oosthuizen');
      cy.get('button.govuk-button').click();
    });

    describe('check enter post code form is correct', () => {
      cy.get('h1.govuk-heading-l').contains('Enter the UK postcode');

      cy.get('form').should('be.visible');
      cy.get('input[name="postcode"]').should('be.visible');
      // enter an empty string and continue
      cy.get('input[name="postcode"]').type(' ');
      cy.get('button.govuk-button').click();
    });

    describe('checks the correct error message is displayed on the postcode entry form', () => {
      cy.get('.govuk-heading-l').contains('Enter the UK postcode');
      cy.get('h1.govuk-heading-l');
      cy.get('.govuk-error-summary').should('be.visible');
      cy.get('.govuk-error-summary__title').should('contain', 'There is a problem');
      cy.get('.govuk-error-summary__body').should('contain', 'Enter a UK postcode');
      cy.get('#postcode-error').should('contain', 'Enter a UK postcode');
    });

    describe('enters a postcode and continue', () => {
      cy.get('input[name="postcode"]').should('be.visible');
      cy.get('input[name="postcode"]').type('EX1 1QA');
      cy.get('button.govuk-button').click();
    });

    describe('do not select an address from the list, click continue and checks the errors', () => {
      // click contiinue without selecting an address
      cy.get('button.govuk-button').click();
      cy.get('.govuk-heading-l').contains('Select the address');
      cy.get('.govuk-error-summary').should('be.visible');
      cy.get('.govuk-error-summary__title').should('contain', 'There is a problem');
      cy.get('.govuk-error-summary__body').should('contain', 'Select an address from the list');
      cy.get('#uprn-error').should('contain', 'Select an address from the list');
    });

    describe('click on the I cannot find the address in the list link', () => {
      cy.get('a.govuk-link').eq(4).should('contain', 'I cannot find the address in the list').click();
    });

    describe('sees the address entry form, sets the input values to empty and continues', () => {
      cy.get('.govuk-heading-l').contains('Enter the address');
      cy.get('form').should('be.visible');
      cy.get('input[name="postcode"]').type(' ');
      cy.get('select[name="country"]').select('Select a country');
      // click continue to display form errors
      cy.get('button.govuk-button').click();
    });
    describe('checks address entry errors', () => {
      cy.get('.govuk-heading-l').contains('Enter the address');
      cy.get('.govuk-error-summary').should('be.visible');
      cy.get('.govuk-error-summary__title').should('contain', 'There is a problem');
      cy.get('a[href="#addressLine2"]').should('contain', 'Enter either a building number or building name');
      cy.get('a[href="#addressLine4"]').should('contain', 'Enter either a street name or town or city');
      cy.get('a[href="#country"]').should('contain', 'Select a country');
    });
    /**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Search by post code and manual address entry
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */

     const address = {
      fao: 'Tester2 Oosthuizen',
      line1: 'Sub-building',
      line2: 'Building number',
      line3: 'Buildng Name',
      line4: 'Street Name',
      town: 'Test Town',
      county: 'RainingAllTheTimeShire',
      postcode: 'RA1 1AN',
      country: 'United Kingdom'
    };

    describe('sees the address entry form and enters all the data', () => {
      cy.get('.govuk-heading-l').contains('Enter the address');
      cy.get('form').should('be.visible');
      cy.get('input[name="addressLine1"]').type(address.line1);
      cy.get('input[name="addressLine2"]').type(address.line2);
      cy.get('input[name="addressLine3"]').type(address.line3);
      cy.get('input[name="addressLine4"]').type(address.line4)
      cy.get('input[name="town"]').type(address.town);
      cy.get('input[name="county"]').type(address.county);
      cy.get('input[name="postcode"]').clear();
      cy.get('input[name="postcode"]').type(address.postcode);
      cy.get('select[name="country"]').select(address.country);
      cy.get('button.govuk-button').click();

    });

    describe('check the address is correct', () => {

      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains('FAO Tester2 Oosthuizen');
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.line1);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.line2);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.line3);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.line4);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.town);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.county);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.postcode);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.country);
    });


  });
});



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
