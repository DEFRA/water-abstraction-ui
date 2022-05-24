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

    describe('User login', () => {
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
    });

    describe('user navigates to the Charge information tab', () => {
      cy.get('#tab_charge').click();
      cy.get('#charge > .govuk-heading-l').should('have.text', 'Charge information');
    });

    describe('click Set up new charge', () => {
      cy.get('.govuk-button').contains('Set up a new charge').click();
    });

    describe('Select reason for new charge information', () => {
      cy.get('#reason-12').click();
      cy.get('form > .govuk-button').contains('Continue').click();
    });

    describe('user sets start date', () => {
      cy.get('.govuk-heading-l').contains('Set charge start date');
      cy.get('#startDate-4').click();
      cy.get('#customDate-day').type('01');
      cy.get('#customDate-month').type('06');
      cy.get('#customDate-year').type('2021');
      cy.get('form > .govuk-button').contains('Continue').click();
    });

    describe('user selects billing contact', () => {
      cy.get('.govuk-heading-l').contains('Who should the bills go to?');
      cy.get('#account').click();
      cy.get('button.govuk-button').click();
    });

    describe('Select an existing address for Big Farm Co Ltd', () => {
      cy.get('#selectedAddress [type="radio"]').first().click();
      cy.get('form > .govuk-button').contains('Continue').click();
    });

    describe('Do you need to add an FAO?', () => {
      cy.get('[id="faoRequired-2"][type="radio"]').click();
      cy.get('form > .govuk-button').contains('Continue').click();
    });

    describe('user checks billing account details', () => {
      cy.get('.govuk-heading-l').contains('Check billing account details');
      cy.get('button.govuk-button').click();
    });

    describe('Use abstraction data to set up the element?', () => {
      cy.get('.govuk-heading-l').contains('Use abstraction data to set up the element?');
      cy.get('[type="radio"]#useAbstractionData').click();
      cy.get('button.govuk-button').click();
    });

    describe('Check charge information', () => {
      cy.get('#main-content')
        .children()
        .should('contain', 'Check charge information');
    });

    describe('Change charge version start date', () => {
      cy.get('a[href*="charge-information/start-date"]').click();
      cy.get('.govuk-heading-l').contains('Set charge start date');
      cy.get('#startDate-4').click();
      cy.get('#customDate-day').clear().type('01');
      cy.get('#customDate-month').clear().type('06');
      cy.get('#customDate-year').clear().type('2022');
      cy.get('form > .govuk-button').contains('Continue').click();
    });

    describe('Select an existing address for Big Farm Co Ltd', () => {
      cy.get('[type="radio"]#billingAccountId').click();
      cy.get('form > .govuk-button').contains('Continue').click();
    });

    describe('Use abstraction data to set up the element?', () => {
      cy.get('.govuk-heading-l').contains('Use abstraction data to set up the element?');
      cy.get('[type="radio"]#useAbstractionData').click();
      cy.get('button.govuk-button').click();
    });

    describe('Check charge information', () => {
      cy.get('#main-content')
        .children()
        .should('contain', 'Check charge information');
    });

    describe('user Assign charge reference', () => {
      cy.get('[value="addChargeCategory"]').click();

      describe('Enter a description for the charge reference', () => {
        cy.get('.govuk-heading-l').contains('Enter a description for the charge reference');
        cy.get('#description').clear().type('Automation-Test');
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Select the source', () => {
        cy.get('.govuk-heading-l').contains('Select the source');
        cy.get('[type="radio"]#source').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Select the loss category', () => {
        cy.get('.govuk-heading-l').contains('Select the loss category');
        cy.get('[type="radio"]#loss').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Enter the total quantity to use for this charge reference', () => {
        cy.get('.govuk-heading-l').contains('Enter the total quantity to use for this charge reference');
        cy.get('#volume').clear().type('150');
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Select the water availability', () => {
        cy.get('.govuk-heading-l').contains('Select the water availability');
        cy.get('[type="radio"]#isRestrictedSource').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Select the water modelling charge', () => {
        cy.get('.govuk-heading-l').contains('Select the water modelling charge');
        cy.get('[type="radio"]#waterModel-2').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Do additional charges apply?', () => {
        cy.get('.govuk-heading-l').contains('Do additional charges apply?');
        cy.get('[type="radio"]#isAdditionalCharges').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Is abstraction from a supported source?', () => {
        cy.get('.govuk-heading-l').contains('Is abstraction from a supported source?');
        cy.get('[type="radio"]#isSupportedSource').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Select the name of the supported source', () => {
        cy.get('.govuk-heading-l').contains('Select the name of the supported source');
        cy.get('[type="radio"]#supportedSourceId-12').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Is abstraction for the supply of public water?', () => {
        cy.get('.govuk-heading-l').contains('Is abstraction for the supply of public water?');
        cy.get('[type="radio"]#isSupplyPublicWater').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });

      describe('Do adjustments apply?', () => {
        cy.get('.govuk-heading-l').contains('Do adjustments apply?');
        cy.get('[type="radio"]#isAdjustments-2').click();
        cy.get('form > .govuk-button').contains('Continue').click();
      });
    });

    describe('Charge category and the element are visible on the charge summary screen', () => {
      cy.get('.govuk-caption-l').eq(1).invoke('text').should('contains', 'Charge reference');
      cy.get('.govuk-caption-m').should('contain', 'Charge element 1');
    });

    describe('Submit charge version, review, approve, and view', () => {
      describe('Submit charge version', () => {
        cy.get('form > .govuk-button').contains('Confirm').click();
        cy.get('.govuk-panel__title').should('contain', 'Charge information complete');
      });

      describe('Review charge version', () => {
        cy.get('a[href*="licences/"]').contains('View charge information').click();
        cy.get('.govuk-heading-l').should('contain', 'Charge information');
        cy.get('a:visible').contains('Review').click();
        cy.get('.govuk-heading-l').eq(0).invoke('text').should('contains', 'Check charge information');
      });

      describe('Approve charge version', () => {
        cy.get('[type="radio"]#reviewOutcome').click();
        cy.get('form > .govuk-button').contains('Continue').click();
        cy.get('.govuk-heading-l').should('contain', 'Charge information');
      });

      describe('', () => {
        cy.get('.govuk-tabs').find('a:visible').contains('View').eq(0).click();
        cy.get('.govuk-heading-l').should('contain', 'Charge information valid');
      });
    });
  });
});
