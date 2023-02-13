const { setUp, tearDown } = require('../../../support/setup')

describe('Licence agreement - Set up, View, End and Delete', () => {
  before(() => {
    tearDown()
    setUp('barebones')
  })

  it('user logs in and sets up new License Agreement, Ends it and deletes the agreement', () => {
    cy.visit(Cypress.env('ADMIN_URI'))
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData)
    })
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
    cy.get('.govuk-button.govuk-button--start').click()
    // assert the user is signed in
    cy.contains('Search')
    cy.get('#query').clear()
    cy.get('#query').type('AT/CURR/DAILY/01').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/DAILY/01').click()

    describe('sets up the sets up new License Agreemen', () => {
      // setting up the new agreement
      cy.get('#tab_charge').click()
      cy.get('#charge').contains('Set up a new agreement').click()
      cy.get('#financialAgreementCode-3').check()
      cy.get('form > .govuk-button').click()
      cy.get('#isDateSignedKnown-2').check()
      cy.get('form > .govuk-button').click()
      cy.get('[type="radio"]').check('true')
      cy.get('#startDate-day').type('01')
      cy.get('#startDate-month').type('01')
      cy.get('#startDate-year').type('2018')
      cy.get('form > .govuk-button').click()
    // Agreement details entered and ready to submit
    })

    describe('Asserting the agreement details before submitting the form', () => {
      cy.get('.govuk-heading-l').contains('Check agreement details').should('be.visible')
      cy.get('.govuk-summary-list__value').contains('Canal and Rivers Trust, unsupported source (S130U)').should('be.visible')
      cy.get('form > .govuk-button').click()
    })

    describe('Viewing, asserting the agreement details after submitting the form', () => {
      cy.get('#tab_summary').should('be.visible')
      cy.get('.govuk-table')
        .children()
        .should('contain', 'End date')
        .should('contain', 'Agreement')
        .should('contain', 'Date signed')
        .should('contain', 'Action')
        .should('contain', 'Canal and Rivers Trust, unsupported source (S130U)')
        .should('contain', 'Delete')
        .should('contain', 'End')
    })

    describe('End the created agreement using invalid date', () => {
      cy.get('a.govuk-link').contains('End').click({ force: true })
      cy.get('.govuk-heading-l').contains('Set agreement end date')
      cy.get('#endDate-day').type('01')
      cy.get('#endDate-month').type('01')
      cy.get('#endDate-year').type('2021')
      cy.get('form > .govuk-button').click()
      // error message
      cy.get('.govuk-error-summary').contains('You must enter an end date that matches some existing charge information or is 31 March.You cannot use a date that is before the agreement start date.').should('be.visible')
    })

    describe('End the created agreement using valid date', () => {
      cy.get('#endDate-day').clear().type('31')
      cy.get('#endDate-month').clear().type('03')
      cy.get('#endDate-year').clear().type('2022')
      cy.get('form > .govuk-button').click()
      cy.get('.govuk-table')
        .children()
        .should('contain', 'End date')
        .should('contain', '31 March 2022')
      // Click end the agreement button
      cy.get('form > .govuk-button').click()
      // assert the agreement end date
      cy.get('.govuk-table')
        .children()
        .should('contain', 'End date').should('be.visible')
        .should('contain', '31 March 2022').should('be.visible')
    })
    describe('Delete the  agreement', () => {
      cy.get('a.govuk-link').contains('Delete').click({ force: true })
      cy.get('.govuk-heading-l').contains("You're about to delete this agreement")
      cy.get('form > .govuk-button').contains('Delete agreement').click()
      cy.get('#charge').contains('Set up a new agreement').should('be.visible')
    })

    // user signing out
    describe('user signing out', () => {
      cy.get('#signout').click()
      cy.contains('You\'re signed out').should('be.visible')
    })
  })
})
