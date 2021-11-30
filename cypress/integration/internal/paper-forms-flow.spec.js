/* /* eslint-disable no-undef */

const { setUp, tearDown } = require('../../support/setup');
const moment = require('moment');

/**
 * click the change address link and check the page loads ok
 */
const changeAddress = (fao) => {
  describe('navigates to the address entry subflow', () => {
    cy.get('[href*="/select-address"]').click();
  });

  describe('check correct form details and page title is displayed for select address', () => {
    cy.get('.govuk-fieldset__heading').contains('Select where to send the form');
    cy.get('.govuk-fieldset__heading').contains('Licence AT/CURR/MONTHLY/02');
    cy.get('form').should('be.visible');
    cy.get('.govuk-radios__label').eq(0).should('contain', 'Big Farm Co Ltd');
    cy.get('.govuk-radios__divider').should('be.visible');
    cy.get('div.govuk-radios').children(2).contains('Set up a one time address');
    cy.get('#selectedRole-3').check();
    cy.get('button.govuk-button').click();
  });

  describe('enters full name for FAO', () => {
    cy.get('.govuk-label').contains('Who should receive the form?');
    cy.get('.govuk-label').contains('Licence AT/CURR/MONTHLY/02');
    cy.get('form').should('be.visible');
    cy.get('#fullName-hint').should('contain', 'Enter full name');
    cy.get('#fullName').should('be.visible');
    // enter the fao name
    cy.get('#fullName').type(fao);
    cy.get('button.govuk-button').click();
  });
};

// check the address is correctly displayed on the returns details page
const checkAddress = (address) => {
  describe('check the address has been changed correctly', () => {
    cy.get('.govuk-heading-l').should('contain.text', 'Check returns details');
    cy.get('form').should('be.visible');
    cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.fao);
    cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.line1);
    cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.line2);
    cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.town);
    cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.postcode);
    cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(address.country);
  });
};

describe('Step through the returns paper forms flow:', function () {
  before(() => {
    tearDown();
    setUp('bulk-return');
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

    const cAddress = {
      line1: 'Big Farm',
      line2: 'Windy road',
      line3: 'Buttercup meadow',
      line4: 'Buttercup Village',
      town: 'Testington',
      postcode: 'TT1 1TT',
      country: 'UK'
    };

    describe('check the address is correct', () => {
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(cAddress.line1);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(cAddress.line2);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(cAddress.line3);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(cAddress.line4);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(cAddress.town);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(cAddress.postcode);
      cy.get('div.govuk-summary-list__row').eq(2).children(1).contains(cAddress.country);
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
      cy.get('input[name="addressLine4"]').type(address.line4);
      cy.get('input[name="town"]').type(address.town);
      cy.get('input[name="county"]').type(address.county);
      cy.get('input[name="postcode"]').clear();
      cy.get('input[name="postcode"]').type(address.postcode);
      cy.get('select[name="country"]').select(address.country);
      cy.get('button.govuk-button').click();
    });

    describe('check the address is correct', () => {
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
    });

    describe('check enter post code form is correct', () => {
      cy.get('h1.govuk-heading-l').contains('Enter the UK postcode');
      cy.get('form').should('be.visible');
      cy.get('.govuk-caption-l').contains('Licence AT/CURR/MONTHLY/02');
      cy.get('input[name="postcode"]').should('be.visible');
      // enter postcode and continue
      cy.get('input[name="postcode"]').type('EX1 1GE');
      cy.get('button.govuk-button').click();
    });
    describe('check and select address from list', () => {
      cy.get('.govuk-heading-l').contains('Select the address');
      cy.get('.govuk-caption-l').contains('Licence AT/CURR/MONTHLY/02');
      cy.get('form').should('be.visible');
      cy.get('.govuk-select').should('be.visible');
      // pick the option and click on it
      cy.get('.govuk-select').select('10013050863');
      // click on continue
      cy.get('button.govuk-button').click();
    });

    const newAddress = {
      fao: 'FAO Tester van der Walt',
      line1: '6',
      line2: 'PRINCESSHAY',
      town: 'EXETER',
      postcode: 'EX1 1GE',
      country: 'United Kingdom'
    };
    describe('check if address is correct', () => {
      // click on the change address link and set the FAO name
      checkAddress(newAddress);
    });

    /**
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   * Enter address outside the UK
   * ∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞
   */
    const outsideAddress = {
      fao: 'Tester2 Oosthuizen',
      line1: 'Sub-building',
      line2: 'Building number',
      line3: 'Buildng Name',
      line4: 'Street Name',
      town: 'Town Name',
      county: 'RainingAllTheTimeShire',
      postcode: 'RA1 N',
      country: 'Croatia'
    };
    describe('enter an address outside the United Kingdom', () => {
      // click on the change address link and check the form has loaded
      changeAddress('Tester2 Oosthuizen');
    });

    describe('click on the I cannot find the address in the list link', () => {
      cy.get('a.govuk-link').eq(4).click();
    });

    describe('enters address in the address entry form and checks the address on the returns form', () => {
      cy.get('.govuk-heading-l').contains('Enter the address');
      cy.get('form').should('be.visible');
      cy.get('#addressLine1').type(outsideAddress.line1);
      cy.get('#addressLine2').type(outsideAddress.line2);
      cy.get('#addressLine3').type(outsideAddress.line3);
      cy.get('#addressLine4').type(outsideAddress.line4);
      cy.get('#town').type(outsideAddress.town);
      cy.get('#county').type(outsideAddress.county);
      cy.get('#postcode').type(outsideAddress.postcode);
      cy.get('#country').select(outsideAddress.country);
      cy.get('button.govuk-button').click();
      checkAddress(outsideAddress);
    });

    describe('Send the paper forms and wait for successful confirmation', () => {
      // click send paper forms
      cy.get('button.govuk-button').contains('Send paper forms').click();
      // wait until the page title appears
      cy.get('.govuk-panel__title', { timeout: 10000 }).should('be.visible');
      cy.get('.govuk-panel__body').contains('They will arrive in three to five working days');
    });
  });
});
