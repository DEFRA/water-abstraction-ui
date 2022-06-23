const { setUp, tearDown } = require('../../support/setup')
const {
  login,
  createBillRun,
  confirmBillRun,
  setTwoPartTariffBillingVolume,
  continueSupplementaryBillRun,
  reviewLicence,
  viewChargeInformation,
  recalculateBills,
  markLicenceForNextSupplementaryRun
} = require('../../support/common')

const recalculateChargesTest = (customVolume) => {
  describe('user enters the supplementary bill flow', () => {
    const type = 'supplementary'
    viewChargeInformation('L1')
    recalculateBills()
    markLicenceForNextSupplementaryRun()
    createBillRun(type)
    reviewLicence()
    cy.get(':nth-child(7) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click()
    setTwoPartTariffBillingVolume(customVolume)
    cy.get(':nth-child(10) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click()
    setTwoPartTariffBillingVolume(customVolume)
    cy.get(':nth-child(13) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click()
    setTwoPartTariffBillingVolume(customVolume)
    cy.get(':nth-child(16) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click()
    setTwoPartTariffBillingVolume(customVolume)
    cy.get(':nth-child(19) > .govuk-grid-column-full > .govuk-table > .govuk-table__body > :nth-child(2) > :nth-child(3) > a').click()
    setTwoPartTariffBillingVolume(customVolume)
    describe('user reviews licenses for bill', () => {
      cy.url().should('contain', '/billing/batch/')
      cy.get('.govuk-heading-xl').contains('Review data issues')
      cy.get('.govuk-button').contains('Continue').click()
    })
    continueSupplementaryBillRun(type)
  })
}

describe('recalculating charges', () => {
  beforeEach(() => {
    tearDown()
    setUp('five-year-two-part-tariff-bill-runs')
    login('billingAndData', 'DEFAULT_PASSWORD')
  })

  afterEach(() => {
    cy.get('#signout').click()
    tearDown()
  })

  it('with no change to charge versions', () => {
    recalculateChargesTest('25')
    cy.get('.govuk-list > li', { timeout: 20000 }).contains('There are no licences ready for this bill run. Check there are licences ready to be billed and try again.')
  })

  it('with change to less volume in charge versions', () => {
    recalculateChargesTest('15')
    confirmBillRun('supplementary')

    cy.get('.govuk-grid-column-two-thirds h2', { timeout: 20000 }).contains('-£1,100.40')
  })

  it('with change to greater volume in charge versions', () => {
    // Note authorised is 30 so custom volume will not be passed into the test
    recalculateChargesTest(null)
    confirmBillRun('supplementary')

    cy.get('.govuk-grid-column-two-thirds h2', { timeout: 20000 }).contains('£550.20')
  })
})
