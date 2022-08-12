const { setUp, tearDown } = require('../../../support/setup')

describe('change internal user permissions as B&D user', () => {
  before(() => {
    tearDown()
    setUp('barebones')
  })

  after(() => {
    tearDown()
  })

  it('searches for user by email address', () => {
    cy.visit(Cypress.env('ADMIN_URI'))
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData)
      const EMAIL_ADDRESS = users.environmentOfficer
      cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
      cy.get('.govuk-button.govuk-button--start').click()
      cy.get('#query').type(EMAIL_ADDRESS)
      cy.get('.search__button').click()
      cy.get('.govuk-grid-column-full > .govuk-heading-m').should('have.text', 'Users')
      cy.get('.govuk-list > li').should('contain.text', EMAIL_ADDRESS)
      cy.get('.govuk-list .govuk-link').click()

      describe('navigates to the user page', () => {
        cy.url().should('contain', '/user/')
        cy.url().should('contain', '/status')
        cy.contains('Internal').should('be.visible')
        cy.get('.govuk-heading-l').eq(0).should('contain', EMAIL_ADDRESS)
        cy.get('.govuk-heading-l').eq(1).should('have.text', 'Set permissions')
      })
      describe('changes the user permissions and navigates to the success page', () => {
        cy.get('#permission-4').check()
        cy.get('form > .govuk-button').click()
        cy.url().should('include', '/update-permissions/success')
        cy.get('.govuk-heading-l').should('contain.text', 'Account permissions are updated')
        cy.get('p.govuk-body').eq(1).should('contain', 'National Permitting Service permissions')
      })
    })
  })
})
