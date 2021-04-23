const { setUp, tearDown } = require('../../support/setup');

describe('search for licences as internal user', () => {
  before(() => {
    tearDown();
    setUp('billing-data');
  });

  after(() => {
    tearDown();
  });

  it('user logs in and searches for a License', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));

    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.psc);
    });
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('.govuk-button.govuk-button--start').click();

    // assert once the user is signed in
    cy.contains('Licences, users and returns');

    // search for a license
    cy.get('#query').type('AT/CURR/DAILY/01').should('be.visible');
    cy.get('.search__button').click();
    cy.contains('Licences').should('be.visible');
  });
  //it('navigates to the licence page', () => {
    //cy.get('td').first().click();

    //expect(browser).toHaveUrlContaining('/licences/');
    //expect(getPageTitle()).toHaveText(LICENCE_NUMBER);
  //});




  
});
