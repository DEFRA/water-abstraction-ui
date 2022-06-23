const { tearDown, setUp } = require('../../support/setup')
const {
  getYearStart,
  login,
  viewBillRuns,
  createBillRun,
  viewChargeInformation
} = require('../../support/common')

describe('non-chargeable licence credits back historic charges', () => {
  before(() => {
    tearDown()
    setUp('five-year-two-part-tariff-bill-runs')
  })

  after(() => {
    tearDown()
  })

  it('user logs in', () => {
    login('billingAndData', 'DEFAULT_PASSWORD')

    describe('user makes a licence non chargeable', () => {
      viewChargeInformation('L1')

      cy.get('#main-content a.govuk-button').contains('Make licence non-chargeable').click()
      cy.get('[type="radio"]#reason').check()
      cy.get('button.govuk-button').contains('Continue').click()
      cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Enter effective date')
      cy.get('.govuk-radios__label').contains('Another date').click()
      const yearStart = getYearStart()
      cy.get('#customDate-day').type(`${yearStart.date()}`)
      cy.get('#customDate-month').type(`${yearStart.month() + 1}`)
      cy.get('#customDate-year').type(`${yearStart.year()}`)
      cy.get('button.govuk-button').contains('Continue').click()
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Check charge information')
      cy.get('button.govuk-button').contains('Confirm').click()
      cy.get('.govuk-panel__title', { timeout: 20000 }).contains('Charge information complete')
      cy.get('.govuk-link').contains('View charge information').click()
      cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Charge information')
      cy.get('.govuk-table .govuk-link').contains('Review').click()
      cy.get('.govuk-heading-l', { timeout: 20000 }).contains('Do you want to approve this charge information?')
      cy.get('[type="radio"]#reviewOutcome').check()
      cy.get('button.govuk-button').contains('Continue').click()
    })

    describe('user enters the supplementary bill flow', () => {
      const type = 'supplementary'
      viewBillRuns()
      cy.get('#main-content > a.govuk-button').contains('Create a bill run').click()
      createBillRun(type)
    })

    describe('user proves the credit has been created', () => {
      cy.get('.govuk-heading-xl', { timeout: 20000 }).contains('Test Region supplementary bill run')
      cy.get('h2 > div > div').should('contain.text', '-£1,100.40')
    })
  })
})
