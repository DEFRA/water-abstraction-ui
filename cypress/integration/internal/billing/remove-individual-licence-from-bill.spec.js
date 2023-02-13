const { setUp, tearDown } = require('../../../support/setup')

describe('remove individual licence from bill', () => {
  before(() => {
    tearDown()
    setUp('supplementary-billing')
  })

  it('user logs in', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'))
    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData)
    })

    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
    cy.get('.govuk-button.govuk-button--start').click()

    // assert once the user is signed in
    cy.contains('Search')

    // user clicks on manage link to set up the supplementary bill run
    describe('user clicks on Manage link', () => {
      cy.get('#navbar-notifications').click()
    })

    describe('user enters the create a new bill flow', () => {
      cy.get('#navbar-bill-runs').contains('Bill runs').click()
      cy.get('#main-content > a.govuk-button').contains('Create a bill run').click()
    })

    describe('user selects supplementary billing type', () => {
      cy.get('#selectedBillingType-2').click()
      cy.get('button.govuk-button').click()
    })

    describe('user selects the test region', () => {
      cy.get('.govuk-radios__item').last().children().first().click()
      cy.get('button.govuk-button').click()
    })

    describe('user waits for batch to finish generating', () => {
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('supplementary bill run')
      cy.url().should('contain', '/summary')
    })

    describe('user views a bill', () => {
      cy.get('#main-content .govuk-table__row .govuk-link').contains('View').first().click()
      cy.url().should('contain', '/invoice/')
    })

    describe('user selects a licence to remove', () => {
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Transactions for 2 licences')
      cy.get('#main-content .govuk-button').contains('Remove licence').first().click()
      cy.url().should('contain', '/delete-licence/')
    })

    describe('user confirms licence removal', () => {
      cy.get('.govuk-heading-l', { timeout: 20000 }).contains('You\'re about to remove this licence from the supplementary bill run')
      cy.get('#main-content .govuk-button').contains('Remove this licence').first().click()
      cy.url().should('contain', '/processing')
    })

    describe('user waits for licence to be removed', () => {
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Transactions for 1 licence')
      cy.contains('Remove licence').should('not.exist')
      cy.url().should('contain', '/invoice/')
    })
  })
})
