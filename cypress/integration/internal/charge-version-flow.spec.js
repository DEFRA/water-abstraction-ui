const { setUp, tearDown } = require('../../support/setup');
const LICENCE_NUMBER = 'AT/CURR/MONTHLY/01';

describe('B&D user able to view charge information tab', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
  });

  after(() => {
    tearDown();
  });

  it('searches for licence by licence number and clicks on it', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.psc);
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').click();
      // assert once the user is signed in
      cy.contains('Licences, users and returns');
      // search for a license
      cy.get('#query').type(LICENCE_NUMBER).should('be.visible');
      cy.get('.search__button').click();
      cy.contains('Licences').should('be.visible');
      // click on the licnce number
      cy.get('td').first().click();
      cy.url().should('contain', '/licences/');
      cy.contains(LICENCE_NUMBER).should('be.visible');
    });
    
    describe('sees the licence tabs and the bills tab is not shown', () => {
      cy.get('ul.govuk-tabs__list').children().should('have.lengthOf.at.least', 3);
      cy.get('#tab_summary').should('have.text', 'Summary');
      cy.get('#tab_returns').should('have.text', 'Returns');
      cy.get('#tab_communications').should('have.text', 'Communications');
      cy.get('ul.govuk-tabs__list').children().should('not.contain', 'Bills');
      cy.get('ul.govuk-tabs__list').children().should('not.contain', 'Charge Information');
    });
  });

  describe('Charge version workflow journey', () => {
    before(() => {
    tearDown();
    setUp('billing-data');
    });

    after(() => {
      tearDown();
    });

    it('searches for licence by licence number and clicks on it', () => {
      cy.visit(Cypress.env('ADMIN_URI'));
      // Enter the user name and Password
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.billingAndData);
        cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
        cy.get('.govuk-button.govuk-button--start').click();
        // assert once the user is signed in
        cy.contains('Licences, users and returns');
        // search for a license
        cy.get('#query').type(LICENCE_NUMBER).should('be.visible');
        cy.get('.search__button').click();
        cy.contains('Licences').should('be.visible');

        // click on the licence number
        cy.get('td').first().click();
        cy.url().should('contain', '/licences/');
        cy.contains(LICENCE_NUMBER).should('be.visible');
      });
      
      describe('sees the licence tabs Summary, returns, communications, bills and charge information', () => {
        cy.get('ul.govuk-tabs__list').children().should('have.lengthOf.at.least', 3);
        cy.get('#tab_summary').should('have.text', 'Summary');
        cy.get('#tab_returns').should('have.text', 'Returns');
        cy.get('#tab_communications').should('have.text', 'Communications');
        cy.get('ul.govuk-tabs__list').children().should('be.visible', 'Bills');
        cy.get('ul.govuk-tabs__list').children().should('be.visible', 'Charge Information');
      });

      describe('navigates to the Charge information tab', () => {
        cy.get('#tab_charge').click();
        cy.get('#charge > .govuk-heading-l').should('have.text', 'Charge information');
      });

      describe('click Set up new charge', () => {
        cy.get('.govuk-button').contains('Set up a new charge').click();
      });

      describe('user selects reason for new charge information', () => {
        cy.get('.govuk-heading-l').contains('Select reason for new charge information');
        cy.get('[type="radio"]#reason').click();
        cy.get('button.govuk-button').click();
      }); 

      describe('user sets start date', () => {
        cy.get('.govuk-heading-l').contains('Set charge start date');
        cy.get('[type="radio"]#startDate').click();
        cy.get('button.govuk-button').click();
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
        cy.get('[type="radio"]#useAbstractionData').click();
        cy.get('button.govuk-button').click();
      });

      describe('user checks charge information details', () => {
        cy.get('.govuk-heading-xl').contains('Check charge information');
        cy.get('.govuk-button').contains('Confirm').click();
      });

      describe('user checks charge information confirmation page', () => {
        cy.get('.govuk-panel__title').contains('Charge information complete');
        cy.get('.govuk-link').contains('View charge information').click();
      });

      describe('user clicks review link', () => {
        cy.get('.govuk-heading-l').contains('Charge information');
        cy.get('.govuk-link').contains('Review').click({ force: true });
      });

      describe('user approves the charge versiobn', () => {
        cy.get('.govuk-heading-l').contains('Check charge information');
        cy.get('[type="radio"]#reviewOutcome').click();
        cy.get('.govuk-button').contains('Continue').click();
      });
      
      describe('navigates to the Charge information tab', () => {
        cy.get('#charge > .govuk-heading-l').should('have.text', 'Charge information');
      });
  
      describe('user sees the new charge version', () => {
        cy.get('.govuk-table__body').contains('td', 'Billing contact change');
        cy.get('.govuk-table__body').contains('td', 'Approved');
      });
    });
  });
}); 