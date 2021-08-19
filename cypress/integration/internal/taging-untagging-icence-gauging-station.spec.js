const { setUp, tearDown } = require('../../support/setup');

describe('tag a licence to a guaging station and untag ', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('user logs and searches for a gauging station and tags the licences', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'));
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.environmentOfficer);
    });
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
    cy.get('.govuk-button.govuk-button--start').click();

    // assert once the user is signed in
    cy.contains('Licences, users and returns');

    // search for a license by using Licence holder Name
    cy.get('#query').clear();
    cy.get('#query').type('Test Station 500').should('be.visible');
    cy.get('.search__button').click();
    cy.get('.govuk-table__row').contains('Test Station 500').should('be.visible').click();
    // clicking the Tag a licence button
    cy.get('.govuk-button').contains('Tag a licence').click();

    // Asserting the liecen tag
    cy.get('.govuk-caption-l').contains('Test Station 500').should('be.visible');
    // enter threshold
    cy.get('#threshold').type(104);

    cy.get('#unit').select('Ml/d');

    cy.get('form > .govuk-button').click();

    cy.get('.govuk-heading-l').contains('Does the licence holder need to stop or reduce at this threshold?');
    cy.get('[type="radio"]').check('stop');
    cy.get('form > .govuk-button').click();

    cy.get('.govuk-heading-l').contains('Enter the licence number this threshold applies to');
    cy.get('#licenceNumber').type('AT/CURR/WEEKLY/01');
    cy.get('form > .govuk-button').click();

    cy.get('.govuk-heading-l').contains('Select the full condition for licence AT/CURR/WEEKLY/01');
    cy.get('[type="radio"]').check('00000000-0000-0000-0000-000000000000');
    cy.get('form > .govuk-button').click();

    cy.get('.govuk-heading-l').contains('Enter an abstraction period for licence');
    cy.get('#startDate-day').type('10');
    cy.get('#startDate-month').type('10');
    cy.get('#endDate-day').type('11');
    cy.get('#endDate-month').type('11');
    cy.get('form > .govuk-button').click();

    cy.get('.govuk-heading-l').contains('Check the restriction details');
    cy.get('form > .govuk-button').click();

    cy.get('.govuk-panel').contains('Licence added to monitoring station');
    cy.get('.govuk-link').contains('Return to monitoring station').click();
   
    cy.get('.govuk-table__body')
      .children()
      .should('contain', 'AT/CURR/WEEKLY/01')
      .should('contain', '10 October to 11 November')
      .should('contain', 'Stop')
      .should('contain', '104')
      .should('contain', 'Ml/d');
    // asserts the station in the
    cy.get('a.govuk-button.govuk-button--secondary').eq(1).click({force:true});

    cy.get('.govuk-heading-l').contains('Which licence do you want to remove a tag from?');
    cy.get('[type="radio"]').check('');
    cy.get('form > .govuk-button').click();

        //  Click Sign out Button

    cy.get('#signout').click();

    //  assert the signout
    cy.contains('You\'re signed out');
  });
});
