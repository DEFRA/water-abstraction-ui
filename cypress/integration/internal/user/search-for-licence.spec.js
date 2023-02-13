const { setUp, tearDown } = require('../../../support/setup')

describe('search for licences as internal user', () => {
  before(() => {
    tearDown()
    setUp('billing-data')
  })

  it('user logs in and searches for a License', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'))
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.psc)
    })
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
    cy.get('.govuk-button.govuk-button--start').click()

    // assert once the user is signed in
    cy.contains('Search')

    // search for a license by using Licence holder Name
    cy.get('#query').clear()
    cy.get('#query').type('barber bakery').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').click()
    cy.get('.govuk-back-link').click()

    // search for a license by using Licence Name or Licence alias
    cy.get('#query').clear()
    cy.get('#query').type(' weekly crumpet').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').click()
    cy.get('.govuk-back-link').click()

    // search for a license by using Licence Name or Licence alias using upper case
    cy.get('#query').clear()
    cy.get('#query').type(' WEEKLY CRUMPET').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').click()
    cy.get('.govuk-back-link').click()

    // search for a license by using Licence Number
    cy.get('#query').clear()
    cy.get('#query').type('AT/CURR/WEEKLY/01').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').click()
    cy.get('.govuk-back-link').click()

    // search for a license by using Licence Number case sensitive
    cy.get('#query').clear()
    cy.get('#query').type('at/CURR/WEEKLY/01').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').click()
    cy.get('.govuk-back-link').click()

    // search for a license by using partial Licence Number
    cy.get('#query').clear()
    cy.get('#query').type('at/CURR/WEEKLY/0').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/WEEKLY/01').click()
    cy.get('.govuk-back-link').click()

    // search for a license by using partial name
    cy.get('#query').clear()
    cy.get('#query').type('shop').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__body').contains('the monthly pie licence').should('be.visible')
    cy.get('.govuk-table__body').contains('AT/CURR/MONTHLY/01').click()
    cy.get('h1.govuk-heading-l').contains('AT/CURR/MONTHLY/01')
    cy.get('.govuk-back-link').click()

    // search for a license by using full name
    cy.get('#query').clear()
    cy.get('#query').type('doughnut store').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__body').contains('the monthly doughnut licence').should('be.visible')
    cy.get('.govuk-table__body').contains('AT/CURR/MONTHLY/02').click()
    cy.get('h1.govuk-heading-l').contains('AT/CURR/MONTHLY/02')
    cy.get('.govuk-back-link').click()

    //  Click Sign out Button
    cy.get('#signout').click()

    //  assert the signout
    cy.contains('You\'re signed out')
  })
})
