const { setUp, tearDown } = require('../../support/setup');
const LICENCE_NUMBER = 'AT/CURR/DAILY/01';

describe('Create SRoC Charge version workflow journey', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
  });

  after(() => {
    tearDown();
  });

  it('Create SRoC Charge version workflow journey', () => {
    cy.visit(Cypress.env('ADMIN_URI'));
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      // assert once the user is signed in
      cy.contains('Search').should('be.visible');
      cy.contains('Enter a licence number, customer name, returns ID, registered email address or monitoring station').should('be.visible');
      // search for a license
      cy.get('#query').type(LICENCE_NUMBER).should('be.visible');
      cy.get('.search__button').click();
      cy.contains('Licences').should('be.visible');

      // click on the licence number
      cy.get('td').first().click();
      cy.url().should('contain', '/licences/');
      cy.contains(LICENCE_NUMBER).should('be.visible');
    });

    describe('user navigates to the Charge information tab', () => {
      cy.get('#tab_charge').click();
      cy.get('#charge > .govuk-heading-l').should('have.text', 'Charge information');
    });

    describe('click Set up new charge', () => {
      cy.get('.govuk-button').contains('Set up a new charge').click();
    });

    describe('user selects reason for new charge information', () => {
      cy.get('.govuk-heading-l').contains('Select reason for new charge information');
      cy.get('[type="radio"]#reason-12').click();
      cy.get('button.govuk-button').click();
    });

    describe('user sets start date', () => {
      cy.get('.govuk-heading-l').contains('Set charge start date');
      cy.get('#startDate-4').click();
      cy.get('#customDate-day').type('01');
      cy.get('#customDate-month').type('06');
      cy.get('#customDate-year').type('2022');
      cy.get('form > .govuk-button').contains('Continue').click();
    });

    describe('user selects billing contact', () => {
      cy.get('.govuk-heading-l').contains('Who should the bills go to?');
      cy.get('[type="radio"]#account').click();
      cy.get('button.govuk-button').click();
    });

    describe('user selects address', () => {
      cy.get('.govuk-heading-l').contains('Select an existing address for Big Farm Co Ltd');
      cy.get('[type="radio"]#selectedAddress').click();
      cy.get('button.govuk-button').click();
    });

    describe('user selects no for FAO', () => {
      cy.get('.govuk-heading-l').contains('Do you need to add an FAO?');
      cy.get('#faoRequired-2').click();
      cy.get('button.govuk-button').click();
    });

    describe('user checks billing account details', () => {
      cy.get('.govuk-heading-l').contains('Check billing account details');
      cy.get('button.govuk-button').click();
    });

    describe('user selects abstraction data', () => {
      cy.get('.govuk-heading-l').contains('Use abstraction data to set up the element?');
      cy.get('#useAbstractionData-4').click();
      cy.get('form > .govuk-button').contains('Continue').click();
    });
    describe('user enters notes', () => {
      cy.get('.govuk-body > .govuk-link').contains('Add a note').should('be.visible').click();
      cy.get('#note').type('This is Automation Testing');
      cy.get('form > .govuk-button').contains('Continue').click();
    });
    describe('user verifies the entered information', () => {
      cy.get('.govuk-summary-list__value').contains('This is Automation Testing').should('be.visible');
      cy.get('.govuk-summary-list__value').contains('1 June 2022').should('be.visible');
    });
    describe('user verifies the entered information', () => {
      cy.get('.govuk-summary-list__value').contains('This is Automation Testing').should('be.visible');
      cy.get('.govuk-summary-list__value').contains('1 June 2022').should('be.visible');
      cy.get('[value="addChargeCategory"]').click();
    });
    describe('user Assign charge referrence', () => {
      cy.get('[value="addChargeCategory"]').click();
      cy.get('#description').type('Automation-Test');
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-radios > :nth-child(1) > #source').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-radios > :nth-child(1) > #loss').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('#volume').type('150');
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-radios > :nth-child(1) > #isRestrictedSource').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('#waterModel-2').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-radios > :nth-child(1) > #isAdditionalCharges').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-radios > :nth-child(1) > #isSupportedSource').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('#supportedSourceId-12').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-radios > :nth-child(1) > #isSupplyPublicWater').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-radios > :nth-child(1) > #isAdjustments').click();
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('#adjustments-2').click();
      cy.get('#chargeFactor').type('25');
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('#main-content')
        .children()
        .should('contain', 'Check charge information')
        .should('contain', 'Licence AT/CURR/DAILY/01')
        .should('contain', '1 June 2022')
        .should('contain', 'This is Automation Testing')
        .should('contain', 'Additional Charges')
        .should('contain', 'Adjustment factor')
        .should('contain', '25');
      cy.get(':nth-child(2) > .govuk-grid-column-full').contains('Confirm').click();
      cy.get('.govuk-panel__title').contains('Charge information complete').should('be.visible');
    });
  });
});
