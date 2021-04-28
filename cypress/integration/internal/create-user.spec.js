const { setUp, tearDown } = require('../../support/setup');

describe('creating an internal user:', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('navigates to the new internal user form and taps on the manage tab', () => {
    cy.visit(Cypress.env('USER_URI'));
    cy.get('#navbar-notifications').click();
    
  });

  it('sees the page header', () => {
    cy.get('.govuk-heading-l').should('have.text','Manage reports and notices');
  });

  it('sees the button to create a user', () => {
    cy.get('.govuk-heading-l').should('have.text','Create an internal account');
  });

  it('clicks on the create user button', () => {
    cy.get(a[href="/account/create-user"]).click();
  });

  //loads the email form:
  it('contains the form on the page', () => {
    cy.get('form').should('be.visible');
  });

  it('has an email field label', () => {
    cy.get('label.govuk-label').should('have.text','Enter a gov.uk email address');
  });

  it('has an email field', () => {
    cy.get('input#email').should('be.visible');
  });

  it('has a submit button', () => {
    cy.get('button.govuk-button').should('have.text','Continue');
  });

  //submit the email form
  // tempId = await uuid();
  //let tempEmail
  it('sees the email field', () => {
    cy.get('input#email').should('be.visible');
  });

  it('populates the email field', () => {
    tempEmail = `regression.tests.${tempId}@defra.gov.uk`;
    cy.get('input#email').type(tempEmail);
  });
  it('submits the form', () => {
    cy.get('button.govuk-button').click();
  });

  //loads the permission form:
  it('contains the form on the page', () => {
   // expect($('form[action="/account/create-user/set-permissions"]')).toBeVisible();
   cy.get('form').should('be.visible');
  });

  it('has eight options',() => {
    cy.get('div.govuk-radios').children().should('have.length',8);
  });

  it('has a submit button', () => {
    cy.get('button.govuk-button').should('have.text','Continue');
  });

  //submits the permissions form:
  it('can see the permission option', () => {
    cy.get('#permission').should('be.visible');
  });
  it('selects a permission level', () => {
    cy.get('#permission').click();
  });
  it('has a submit button', () => {
    cy.get('button.govuk-button').should('have.text','Continue');
  });
  it('submits the form', () => {
    cy.wait(300);
    cy.get('button.govuk-button').click();
    cy.wait(300);
  });
});
