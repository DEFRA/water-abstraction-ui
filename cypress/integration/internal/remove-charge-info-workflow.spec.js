const { setUp, tearDown } = require('../../support/setup');
const firstRowSelector = '#toSetUp .govuk-table > tbody:nth-child(2) > tr:nth-child(1)';

/* eslint-disable no-undef */
describe('remove charge info workflow as B&D user', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });


  it('navigates to charge info workflow page', () => {

    cy.visit(Cypress.env('ADMIN_URI'));
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData);
    });

    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('.govuk-button.govuk-button--start').click();
    cy.getCookie('session');
    cy.get('#navbar-notifications').click();
    cy.get('.govuk-heading-m').eq(5).should('have.text','View charge information workflow')
    //navigates to charge info workflow page
    cy.get('[href*="/charge-information-workflow"]').click();
    cy.get('.govuk-heading-xl').should('contain.text','Charge information workflow');
    
  });

  it('sees the workflow tabs', () => {

    cy.get('#tab_toSetUp').should('contain.text','To set up');
    cy.get('#tab_review').should('contain.text','Review');
    cy.get('#tab_changeRequest').should('contain.text','Change request');
  });

   
  it('sees the expected workflow in the table', () => {
    cy.get('.govuk-table__cell').eq(0).should('contain.text','AN/030/0013/008');
    cy.get('.govuk-table__cell').eq(1).should('contain.text','R HARNESS & SONS LTD'); 
  });

 
 
  it('sees the action links against the workflow and clicks the Remove link ', () => {

    cy.get(`${firstRowSelector} [href$="/charge-information/create"]`).should('have.text','Set up');
    cy.get(`${firstRowSelector} [href$="/remove"]`).should('have.text','Remove').click();
  });

  /*
  
  it('sees confirmation page', () => {
    cy.url().should('include','/charge-information-workflow');
    cy.url().should('include','/remove');
    cy.get('govuk-heading-l').should('have.text','Youre about to remove this licence from the workflow');
  });

  it('sees the data on the confirmation page', () => {
    cy.get('.govuk-table').eq(0).should('have.text','123/456');
    cy.get('.govuk-table').eq(1).should('have.text','Mr John Testerton');
    cy.get('.govuk-table').eq(2).should('have.text','1 April 2008');
  });

  it('clicks remove button and is redirected back to workflow page', () => {
    cy.get('.govuk-button').click();
    cy.url().should('include','/charge-information-workflow');
  });

  it('removes workflow and sees that it has been removed', () => {
    cy.get('#toSetUp .govuk-table').eq(0).should('have.text','123/456');
    cy.get('#toSetUp .govuk-table').eq(1).should('have.text','Mr John Testerton');
    cy.get('#toSetUp .govuk-table').eq(2).should('have.text','1 April 2008');
  });*/
});
 