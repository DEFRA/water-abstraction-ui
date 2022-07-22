const { setUp, tearDown } = require('../../support/setup')
const { createSrocChargeVersion, approveSrocChargeVersion } = require('../../support/sroc-charge-version')
const { createAnnualBillRun } = require('../../support/annual-bill-run')
const LICENCE_NUMBER = 'AT/CURR/DAILY/01'

describe('annual bill run', () => {
  beforeEach(() => {
    tearDown()
    setUp('billing-data')
  })

  afterEach(() => {
    tearDown()
  })

  it('user logs in and generates annual bill', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'))

    // Enter the user name and Password
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData)
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
      cy.get('.govuk-button.govuk-button--start').click()

      // assert once the user is signed in
      cy.contains('Search')

      createSrocChargeVersion(LICENCE_NUMBER)
      approveSrocChargeVersion()
      createAnnualBillRun()
    })
      describe('download the Annual Bill', () => {
        cy.get('.govuk-grid-column-full > .govuk-button').should('have.attr',"href")
        .and('contain','/transactions-csv')
        cy.window().document().then(function (doc) {
          doc.addEventListener('click', () => {
            setTimeout(function () { doc.location.reload() }, 5000)
        })
        // downloading the bill
        cy.get('.govuk-grid-column-full > .govuk-button').click()
      })
    })
  })
})  
