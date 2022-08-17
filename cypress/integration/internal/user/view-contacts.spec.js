const { setUp, tearDown } = require('../../../support/setup')
const LICENCE_NUMBER = 'AT/CURR/DAILY/01'

describe('view contacts assigned to the licence ', () => {
  before(() => {
    tearDown()
    setUp('billing-data')
  })

  after(() => {
    tearDown()
  })

  it('searches for licence by licence number and clicks on it', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'))
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.psc)
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
      cy.get('.govuk-button.govuk-button--start').click()
      // assert once the user is signed in
      cy.contains('Search')
      // search for a license
      cy.get('#query').type(LICENCE_NUMBER).should('be.visible')
      cy.get('.search__button').click()
      cy.contains('Licences').should('be.visible')
      // click on the licnce number
      cy.get('td').first().click()
      cy.url().should('contain', '/licences/')
      cy.contains(LICENCE_NUMBER).should('be.visible')
    })

    describe('user clicks on the contact details', () => {
      cy.get('#tab_contacts').click()
      cy.get('#contacts > .govuk-heading-l').contains('Contact detail').should('be.visible')
      cy.get('#contacts').contains('Go to customer contacts').should('be.visible')
      cy.get('#contacts').contains('Go to customer contacts').click({ force: true })
      cy.get('#main-content').contains('Licences').should('be.visible')
      cy.get('#main-content').contains('Billing accounts').should('be.visible')
      cy.get('#main-content').contains('Contacts').should('be.visible')
    })
  })
})
