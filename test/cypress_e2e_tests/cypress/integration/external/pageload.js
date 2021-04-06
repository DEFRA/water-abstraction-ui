describe('Page loading', () => {
  it('the login page loads', () => {
    //  cy.visit ('http://localhost:8008/signin')
    cy.visit('');

    //  finding the site title
    cy.contains('Manage your water abstraction or impoundment licence').should('have.attr', 'href', '/');
  });
});
