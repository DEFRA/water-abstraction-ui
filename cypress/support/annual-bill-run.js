const createAnnualBillRun = () => {
  // user clicks on manage link to set up the supplementary bill run
  describe('user clicks on Bill runs link', () => {
    cy.get('#navbar-bill-runs').click();
  });

  describe('user enters the create a new bill flow', () => {
    cy.get('.govuk-button').contains('Create a bill run').click();
  });

  describe('user selects annual billing type', () => {
    cy.get('[type="radio"]').check('annual');
    cy.get('button.govuk-button').click();
  });

  describe('user selects the test region', () => {
    cy.get('[type="radio"]#selectedBillingRegion-9').last().check();
    cy.get('button.govuk-button').click();
  });

  describe('user cancels the bill after generating it', () => {
    cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('annual bill run');
    cy.url().should('contain', '/summary');
    cy.get('div.govuk-grid-column-two-thirds').eq(3).children(1).contains('Cancel bill run').click();
    cy.get('button.govuk-button').click();
    cy.get('a.govuk-button').eq(2).click();
  });

  describe('user generates the annual bill ', () => {
    cy.get('[type="radio"]').check('annual');
    cy.get('button.govuk-button').click();
    cy.get('[type="radio"]#selectedBillingRegion-9').last().check();
    cy.get('button.govuk-button').click();
    cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('annual bill run');
    cy.url().should('contain', '/summary');
    cy.get('#tab_other-abstractors').click();
    cy.get('.govuk-table__row').eq(1).should('contain', 'Mr John J Testerson');
    cy.get('div.govuk-grid-column-two-thirds').eq(3).children(0).contains('Confirm bill run').click();
    cy.get('.govuk-heading-l').should('contain', 'You\'re about to send this bill run');
    cy.get('button.govuk-button').click();
    cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Bill run sent');
    cy.get('div.govuk-grid-column-two-thirds').eq(1).children(3).contains('Go to bill run').click();
  });
};

exports.createAnnualBillRun = createAnnualBillRun;