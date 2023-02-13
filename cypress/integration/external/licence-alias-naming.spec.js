const { setUp, tearDown } = require('../../support/setup')
describe('View Licences as external user', () => {
  before(() => {
    tearDown()
    setUp('barebones')
  })

  it('Create the alias name for the licences user is holding', () => {
    //  cy.visit to visit the URL
    cy.visit(Cypress.env('USER_URI'))
    cy.get('a[href*="/signin"]').click()
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.external)
    })
    cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'))
    cy.get('.govuk-button.govuk-button--start').click()
    cy.contains('Manage your water abstraction or impoundment licence').should('be.visible')

    // assert the licences in the table
    cy.contains('AT/CURR/DAILY/01').should('be.visible')
    cy.contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.contains('AT/CURR/MONTHLY/01').should('be.visible')
    cy.contains('AT/CURR/MONTHLY/02').should('be.visible')
    cy.get('.licence-result__column').contains('AT/CURR/DAILY/01').click()
    cy.get('.govuk-summary-list__value > a').contains('Rename this licence').click()
    cy.get('#name').clear()
    cy.get('#name').type('the new daily cupcake licence')
    cy.get('form > .govuk-button').contains('Save').click()
    cy.get('#summary').contains('the new daily cupcake licence').should('be.visible')

    // Negative scenario - Creating the licence alias name using empty fields
    describe('Negative scenario - Creating the licence alias name using empty fields', () => {
      cy.get('#navbar-view').contains('View licences').click()

      // assert the licences in the table

      cy.contains('AT/CURR/WEEKLY/01').should('be.visible')
      cy.get('.licence-result__column').contains('AT/CURR/WEEKLY/01').click()
      cy.get('.govuk-summary-list__value > a').contains('Rename this licence').click()
      cy.get('#name').clear()
      cy.get('#name').type('   ')
      cy.get('form > .govuk-button').contains('Save').click()
      cy.get('.govuk-error-summary').contains('There is a problem').should('be.visible')

      // Creating the licence alias name using numbers
      describe('Creating the licence alias name using empty fields', () => {
        cy.get('#navbar-view').contains('View licences').click()

        // assert the licences in the table
        cy.contains('AT/CURR/WEEKLY/01').should('be.visible')
        cy.get('.licence-result__column').contains('AT/CURR/WEEKLY/01').click()
        cy.get('.govuk-summary-list__value > a').contains('Rename this licence').click()
        cy.get('#name').clear()
        cy.get('#name').type(1234)
        cy.get('form > .govuk-button').contains('Save').click()
        cy.get('#summary').contains(1234).should('be.visible')
        cy.get('#navbar-view').contains('View licences').click()
        cy.get('.licence-result__column--description').contains(1234).should('be.visible')

        // Creating the licence alias name using chracters and numbers
        describe('Creating the licence alias name using empty fields', () => {
          cy.get('#navbar-view').contains('View licences').click()

          // assert the licences in the table
          cy.contains('AT/CURR/MONTHLY/01').should('be.visible')
          cy.get('.licence-result__column').contains('AT/CURR/MONTHLY/01').click()
          cy.get('.govuk-summary-list__value > a').contains('Rename this licence').click()
          cy.get('#name').clear()
          cy.get('#name').type('Cupcake Factory' + 5000)
          cy.get('form > .govuk-button').contains('Save').click()
          cy.get('#summary').contains('Cupcake Factory5000').should('be.visible')
          cy.get('#navbar-view').contains('View licences').click()
          cy.get('.licence-result__column--description').contains('Cupcake Factory5000').should('be.visible')

          cy.get('#signout').click()

          //  assert the signout
          cy.contains('You\'re signed out').should('be.visible')
        })
      })
    })
  })
})
