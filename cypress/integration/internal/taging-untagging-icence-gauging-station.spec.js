const { setUp, tearDown } = require('../../support/setup');

describe('tag a licence to a guaging station and untag ', () => {
  before(() => {
    tearDown();
    setUp('barebones');
  });

  after(() => {
    tearDown();
  });

  it('user logs and searches for a gauging station, tags and untags the licences', () => {
    describe('User Tags the licence', () => {
      // cy.visit to visit the URL
      cy.visit(Cypress.env('ADMIN_URI'));
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.environmentOfficer);
      });
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'));
      cy.get('.govuk-button.govuk-button--start').contains('Sign in').click();
      // assert once the user is signed in
      cy.contains('Search');

      // search for a license by using Licence holder Name
      cy.get('#query').clear();
      cy.get('#query').type('Test Station 500').should('be.visible');
      cy.get('.search__button').contains('Search').click();
      cy.get('.govuk-table__row').contains('Test Station 500').should('be.visible').click();
      // clicking the Tag a licence button
      cy.get('.govuk-button').contains('Tag a licence').click();

      // asserting the liecence to tag
      cy.get('.govuk-caption-l').contains('Test Station 500').should('be.visible');
      // assert the validations for submitting the empty details
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-error-summary').contains('There is a problem').should('be.visible');
      cy.get('.govuk-error-summary').contains('Enter a number in digits and no other characters other than a decimal point').should('be.visible');

      // enter the data required to tag the licenceand click continue
      cy.get('#threshold').type(104);
      cy.get('#unit').select('Ml/d');
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-heading-l').contains('Does the licence holder need to stop or reduce at this threshold?');
      cy.get('[type="radio"]').check('stop');
      cy.get('form > .govuk-button').contains('Continue').click();

      // asert the licence details and click submit button
      cy.get('.govuk-heading-l').contains('Enter the licence number this threshold applies to');
      cy.get('#licenceNumber').type('AT/CURR/WEEKLY/01');
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-heading-l').contains('Select the full condition for licence AT/CURR/WEEKLY/01');
      cy.get('[type="radio"]').check();
      cy.get('form > .govuk-button').contains('Continue').click();

      // asert the abstraction heading and enter the abstarction period data
      cy.get('.govuk-heading-l').contains('Enter an abstraction period for licence');
      cy.get('#startDate-day').type('10');
      cy.get('#startDate-month').type('10');
      cy.get('#endDate-day').type('11');
      cy.get('#endDate-month').type('11');
      cy.get('form > .govuk-button').contains('Continue').click();
      cy.get('.govuk-heading-l').contains('Check the restriction details');
      cy.get('form > .govuk-button').contains('Confirm').click();
      cy.get('.govuk-panel').contains('Licence added to monitoring station');
      cy.get('.govuk-link').contains('Return to monitoring station').click();

      // asert the data of the tagged licence
      cy.get('.govuk-table__body')
        .children()
        .should('contain', 'AT/CURR/WEEKLY/01')
        .should('contain', '10 October to 11 November')
        .should('contain', 'Stop')
        .should('contain', '104')
        .should('contain', 'Ml/d');
    });
    describe('User Un-tags the licence', () => {
      cy.get('a.govuk-button.govuk-button--secondary').eq(1).click({ force: true });
      cy.get('.govuk-heading-l').contains('Which licence do you want to remove a tag from?');
      cy.get('.govuk-radios__item > #selectedLicence').check();
      cy.get('form > .govuk-button').click();

      // asert the details of the licence is being untagged and click confirm
      cy.get('.govuk-fieldset__heading').contains('You are about to remove tags from this licence').should('be.visible');
      cy.get('form > .govuk-button').contains('Confirm').click();

      // assert the licence is untagged
      cy.get('.govuk-heading-l').contains('Test Station 500').should('be.visible');
      cy.get('.govuk-body').contains('There are no licences tagged with restrictions for this monitoring station').should('be.visible');
      cy.get('.govuk-button').contains('Tag a licence').should('be.visible');
    });

    //  Click Sign out Button
    cy.get('#signout').click();
    //  assert the signout
    cy.contains('You\'re signed out');
  });
});
