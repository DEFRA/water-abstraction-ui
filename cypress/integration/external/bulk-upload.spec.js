import 'cypress-file-upload'
const { setUp, tearDown } = require('../../support/setup')

describe('Bulk upload returns test', () => {
  before(() => {
    tearDown()
    setUp('bulk-return')
  })

  after(() => {
    tearDown()
  })

  it('User bulk upload test', () => {
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

    //  assert once the user is signed in
    cy.contains('Add licences or give access')
    cy.contains('AT/CURR/DAILY/01').should('be.visible')
    cy.contains('AT/CURR/WEEKLY/01').should('be.visible')
    cy.contains('AT/CURR/MONTHLY/01').should('be.visible')
    cy.contains('AT/CURR/MONTHLY/02').should('be.visible')

    cy.get(':nth-child(2) > h2.licence-result__column > a').contains('AT/CURR/DAILY/01').click()
    cy.get('#navbar-returns').click()
    cy.get('p > a').click()

    cy.window().document().then(function (doc) {
      doc.addEventListener('click', () => {
        setTimeout(function () { doc.location.reload() }, 5000)
      })
      cy.get('.govuk-list > :nth-child(1) > a').click()
    })
    cy.get('.govuk-grid-column-two-thirds > .govuk-button').click()

    const filepath = 'downloads/big farm co ltd monthly return.csv'
    cy.get('input[type="file"]').attachFile(filepath)
    cy.get('button.govuk-button').click()
    cy.contains('Uploading returns data')
    cy.contains('Your data is ready to send', { timeout: 100000 })
    // submit the bulk return
    cy.get('form > .govuk-button').contains('Submit').click()
    cy.contains('Returns submitted', { timeout: 200000 }).should('be.visible')
  })
})
