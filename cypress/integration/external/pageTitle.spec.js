describe('Page title verification', () => {
  it('the login page loads', () => {
    cy.visit(Cypress.env('USER_URI'));

    //  finding the site title
    cy.contains('.govuk-header__link--service-name', 'Manage your water abstraction or impoundment licence');
  });
});
