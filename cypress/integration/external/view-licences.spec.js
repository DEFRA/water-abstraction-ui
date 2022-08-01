const { setUp, tearDown } = require('../../support/setup')
describe('View Licences as external user', () => {
  before(() => {
    tearDown()
    setUp('barebones')
  })

  after(() => {
    tearDown()
  })

  it('View licenses and verify them', () => {
    //  cy.visit to visit the URL
    cy.visit(Cypress.env('USER_URI'))

    // tap the sign in button on the welcome page
    cy.get('a[href*="/signin"]').click()

    //  Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.external)
    })
    cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'))

    //  Click Sign in Button
    cy.get('.govuk-button.govuk-button--start').click()

    // assert the page title
    cy.contains('Manage your water abstraction or impoundment licence')

    // assert Your licences text on the licences table
    cy.contains('Your licences').should('have.class', 'govuk-heading-l')

    // assert the licences in the table

    // all searches are automatically rooted to the found tr element
    cy.contains('AT/CURR/DAILY/01').should('be.visible')
    cy.contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.contains('AT/CURR/MONTHLY/01').should('be.visible')
    cy.contains('AT/CURR/MONTHLY/02').should('be.visible')

    //  Click Sign out Button
    cy.get('#signout').click()
    //  assert the signout
    cy.contains('You\'re signed out')
  })
})
