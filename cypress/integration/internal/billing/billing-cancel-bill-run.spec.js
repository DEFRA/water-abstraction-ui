const{ setUp, tearDown} = require('../../../support/setup')

describe('Cancel bill run', () => {
  before(() => {
    tearDown()
    setUp('supplementary-billing')
  })

  after(() => {
    tearDown()
  })

  it('user logs in, creates and cancels a bill run [supplimentary, annual, 2PT]', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'))

    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData)
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
      cy.get('.govuk-button.govuk-button--start').click()
    })

    describe('user creates a supplementary bill run and cancels it ', () => {
      cy.get('#navbar-bill-runs').contains('Bill runs').click()
      cy.get('#main-content > a.govuk-button').contains('Create a bill run').click()

      cy.get('[type="radio"]').check('supplementary')
      cy.get('button.govuk-button').click()

      cy.get('.govuk-radios__item').last().children().first().click()
      cy.get('button.govuk-button').click()

      cy.get('[role="button"]', { timeout: 1000 }).should('contain', 'Cancel bill run')
      cy.get('[role="button"]').click()

      cy.contains('You\'re about to cancel this bill run').should('be.visible')
      cy.contains('Cancel bill run').click()
      cy.contains('Bill runs')

      cy.contains('Create a supplementary, annual or two-part tariff bill run.').should('be.visible')
      cy.url().should('contain', 'billing/batch/list')
    })

    describe('user creates an annual bill run and cancels it ', () => {
      cy.get('#navbar-bill-runs').contains('Bill runs').click()
      cy.get('#main-content > a.govuk-button').contains('Create a bill run').click()

      cy.get('[type="radio"]').check('annual')
      cy.get('button.govuk-button').click()

      cy.get('.govuk-radios__item').last().children().first().click()
      cy.get('button.govuk-button').click()

      cy.get('[role="button"]', { timeout: 1000 }).should('contain', 'Cancel bill run')
      cy.get('[role="button"]').click()

      cy.contains('You\'re about to cancel this bill run').should('be.visible')
      cy.contains('Cancel bill run').click()
      cy.contains('Bill runs')

      cy.contains('Create a supplementary, annual or two-part tariff bill run.').should('be.visible')
      cy.url().should('contain', 'billing/batch/list')
    })

    describe('user creates a 2PT bill run and cancels it ', () => {
      cy.get('#navbar-bill-runs').contains('Bill runs').click()
      cy.get('#main-content > a.govuk-button').contains('Create a bill run').click()

      cy.get('[type="radio"]').check('two_part_tariff')
      cy.get('[type="radio"]').check('summer')
      cy.get('button.govuk-button').click()

      cy.get('.govuk-radios__item').last().children().first().click()
      cy.get('button.govuk-button').click()

      cy.get('#select-financial-year').click()
      cy.get('button.govuk-button').click()

      cy.get('[role="button"]', { timeout: 1000 }).should('contain', 'Cancel bill run')
      cy.get('[role="button"]').click()

      cy.contains('You\'re about to cancel this bill run').should('be.visible')

      cy.contains('Cancel bill run').click()
      cy.contains('Bill runs')

      cy.contains('Create a supplementary, annual or two-part tariff bill run.').should('be.visible')
      cy.url().should('contain', 'billing/batch/list')
    })
  })
})
