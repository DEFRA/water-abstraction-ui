const { setUp, tearDown } = require('../../support/setup');
const { checkInlineAndSummaryErrorMessage, validateRadioOptions, validateRadioOptionsNthChild1, checkNoErrorMessage } = require('../../support/validation');
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
        cy.get('#customDate-year').type('2022');
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

    describe('Add a new charge element',()=>{
        cy.get('[value="addElement"]').click();
        // cy.get('.govuk-heading-l').contains('Use abstraction data to set up the element?');
        // cy.get('[type="radio"]#useAbstractionData').click();
        // cy.get('button.govuk-button').click();
        

    });

    

    describe('Check charge information and add Charge Category', () => {
      cy.get('#main-content')
        .children()
        .should('contain', 'Check charge information');
    
    });

    
  });
});
